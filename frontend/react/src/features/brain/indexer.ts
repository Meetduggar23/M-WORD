/* ============================================================
   Document Brain — indexing pipeline

   Document → parse → structured chunks → TF-IDF vectors → index
   Retrieval powers semantic search and Ask-Document with sources.
   Runs fully on-device; only retrieved chunks ever go to the
   configured AI provider.
   ============================================================ */

import { QuillDocument, Paragraph, Table, Block } from '../../engine/DocumentEngine';

export interface DocChunk {
  id: string;
  blockId: string;
  /** Heading path, e.g. ["Methodology", "Data Collection"] */
  headingPath: string[];
  /** Nearest heading label — used for source display */
  heading: string;
  /** Estimated 1-based page number (≈320 words per page) */
  page: number;
  kind: 'paragraph' | 'heading' | 'table' | 'list';
  text: string;
}

/** Sparse L2-normalized TF-IDF vector: token → weight */
export type SparseVector = Map<string, number>;

export interface DocIndex {
  chunks: DocChunk[];
  weights: Map<string, SparseVector>;
  idf: Map<string, number>;
  builtAt: number;
  /** Content fingerprint — used to skip redundant rebuilds */
  fingerprint: number;
}

const STOPWORDS = new Set(
  ('a an and are as at be but by for from has have he her his if in into is it its of on or she that the ' +
    'their there these they this to was were will with you your i we us our not no yes do does did can could ' +
    'should would may might must shall about above after again all also am any because been before being below ' +
    'between both during each few more most other some such than then through under until up very what when where which while who whom why').split(' '),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^['-]+|['-]+$/g, ''))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Stable 32-bit string hash for the fingerprint. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ─── Parsing ─────────────────────────────────────────────────────────────── */

const WORDS_PER_PAGE = 320;

function paragraphText(p: Paragraph): string {
  return p.textRuns.map((r) => r.text).join('');
}

function tableText(t: Table): string {
  const rows = t.rows.map((row) =>
    row.cells
      .map((c) => c.textRuns.map((r) => r.text).join('') || c.paragraphs.map(paragraphText).join(' '))
      .filter(Boolean)
      .join(' | '),
  );
  return rows.join('. ');
}

/** Parse a document into structured chunks with heading context. */
export function parseDocument(doc: QuillDocument): DocChunk[] {
  const chunks: DocChunk[] = [];
  const headingPath: string[] = [];
  let wordsSoFar = 0;

  for (const section of doc.sections ?? []) {
    for (const block of section.blocks as Block[]) {
      if (block.type === 'paragraph') {
        const para = block as Paragraph;
        const text = paragraphText(para).trim();
        const style = para.style ?? 'Normal';
        const isHeading = /^Heading\d/.test(style) || style === 'Title';

        if (isHeading && text) {
          const level = style === 'Title' ? 0 : parseInt(style.replace('Heading', ''), 10) || 1;
          headingPath.splice(level);
          headingPath[level] = text;
          chunks.push({
            id: para.id,
            blockId: para.id,
            headingPath: [...headingPath.filter(Boolean)],
            heading: text,
            page: Math.floor(wordsSoFar / WORDS_PER_PAGE) + 1,
            kind: 'heading',
            text,
          });
          wordsSoFar += 8;
          continue;
        }

        if (!text) continue;
        wordsSoFar += text.split(/\s+/).length;
        chunks.push({
          id: para.id,
          blockId: para.id,
          headingPath: [...headingPath.filter(Boolean)],
          heading: headingPath[headingPath.length - 1] ?? doc.metadata.title ?? 'Document',
          page: Math.floor(wordsSoFar / WORDS_PER_PAGE) + 1,
          kind: para.formatting?.listFormat?.type !== 'none' ? 'list' : 'paragraph',
          text,
        });
      } else if (block.type === 'table') {
        const table = block as Table;
        const text = tableText(table);
        if (!text) continue;
        wordsSoFar += Math.ceil(text.split(/\s+/).length * 0.6);
        chunks.push({
          id: table.id,
          blockId: table.id,
          headingPath: [...headingPath.filter(Boolean)],
          heading: headingPath[headingPath.length - 1] ?? 'Table',
          page: Math.floor(wordsSoFar / WORDS_PER_PAGE) + 1,
          kind: 'table',
          text,
        });
      }
    }
  }
  return chunks;
}

/* ─── Vectorization (TF-IDF, L2-normalized) ────────────────────────────────── */

export function buildIndex(doc: QuillDocument, previous?: DocIndex): DocIndex {
  const fingerprint = fingerprintDocument(doc);
  if (previous && previous.fingerprint === fingerprint) return previous;

  const chunks = parseDocument(doc);
  const N = Math.max(1, chunks.length);

  // Document frequency
  const docFreq = new Map<string, number>();
  const chunkTokens = chunks.map((c) => {
    const tokens = tokenize(`${c.heading} ${c.text}`).map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
    const set = new Set(tokens);
    for (const t of set) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    return tokens;
  });

  const idf = new Map<string, number>();
  for (const [t, df] of docFreq) idf.set(t, Math.log((N + 1) / (df + 0.5)));

  const weights = new Map<string, SparseVector>();
  chunkTokens.forEach((tokens, i) => {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const vec: SparseVector = new Map();
    let norm = 0;
    for (const [t, f] of tf) {
      const w = (1 + Math.log(f)) * (idf.get(t) ?? 0);
      vec.set(t, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [t, w] of vec) vec.set(t, w / norm);
    weights.set(chunks[i].id, vec);
  });

  return { chunks, weights, idf, builtAt: Date.now(), fingerprint };
}

export function fingerprintDocument(doc: QuillDocument): number {
  let fp = 0;
  for (const s of doc.sections ?? []) {
    for (const b of s.blocks) {
      if (b.type === 'paragraph') {
        const p = b as Paragraph;
        fp = (Math.imul(fp, 31) + hashString(`${p.id}:${paragraphText(p)}:${p.style ?? ''}`)) >>> 0;
      } else {
        fp = (Math.imul(fp, 31) + hashString(b.id)) >>> 0;
      }
    }
  }
  return fp;
}

/* ─── Retrieval ───────────────────────────────────────────────────────────── */

export interface SearchHit {
  chunk: DocChunk;
  score: number;
}

export function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  let dot = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [t, w] of small) {
    const other = large.get(t);
    if (other) dot += w * other;
  }
  return dot; // both vectors are L2-normalized
}

/**
 * Semantic search over the index: TF-IDF cosine similarity with a boost for
 * heading matches. Purely on-device; understands term importance and
 * inflection (plurals), not deep synonyms.
 */
export function semanticSearch(index: DocIndex, query: string, limit = 8): SearchHit[] {
  if (!index.chunks.length || !query.trim()) return [];
  const tokens = tokenize(query).map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
  if (!tokens.length) return [];

  const qWeights = new Map<string, number>();
  for (const t of tokens) qWeights.set(t, (qWeights.get(t) ?? 0) + 1);
  let qNorm = 0;
  for (const [t, f] of qWeights) {
    const w = (1 + Math.log(f)) * (index.idf.get(t) ?? Math.log((index.chunks.length + 1) / 1.5));
    qWeights.set(t, w);
    qNorm += w * w;
  }
  qNorm = Math.sqrt(qNorm) || 1;
  for (const [t, w] of qWeights) qWeights.set(t, w / qNorm);

  const hits: SearchHit[] = [];
  for (const chunk of index.chunks) {
    const sim = cosineSimilarity(qWeights, index.weights.get(chunk.id) ?? new Map());
    if (sim <= 0.02) continue;
    const headingBoost = chunk.kind === 'heading' ? 1.15 : 1;
    hits.push({ chunk, score: sim * headingBoost });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface RetrievedContext {
  chunks: DocChunk[];
  /** Numbered context block for the AI provider */
  contextText: string;
}

/** Retrieve the most relevant chunks for a question (Ask Document). */
export function retrieveForQuestion(index: DocIndex, question: string, maxChunks = 6): RetrievedContext {
  const hits = semanticSearch(index, question, maxChunks);
  const contextText = hits
    .map((h, i) => `[${i + 1}] (page ${h.chunk.page}, "${h.chunk.heading}")\n${h.chunk.text}`)
    .join('\n\n');
  return { chunks: hits.map((h) => h.chunk), contextText };
}

export function chunkByBlockId(index: DocIndex, blockId: string): DocChunk | undefined {
  return index.chunks.find((c) => c.blockId === blockId);
}
