/* ============================================================
   Smart References — automatic Figure/Table numbering.
   Captions are paragraphs whose text starts with "Figure N" or
   "Table N" (optionally styled Caption). References are runs
   matching "Figure N" / "Table N" inside other paragraphs.
   Renumbering rewrites captions in document order and updates
   every reference so links never go stale.
   ============================================================ */

import { QuillDocument, Paragraph, Block } from '../../engine/DocumentEngine';

export type RefKind = 'figure' | 'table';

export interface CaptionEntry {
  blockId: string;
  kind: RefKind;
  /** Current number parsed from the caption */
  number: number;
  text: string;
}

const CAPTION_RE = /^(figure|fig\.|table)\s+(\d+)/i;
const REF_RE = /\b((?:figure|fig\.|table)\s+)(\d+)\b/gi;

function paraText(p: Paragraph): string {
  return p.textRuns.map((r) => r.text).join('');
}

function isCaption(p: Paragraph): CaptionEntry | null {
  const text = paraText(p).trim();
  const m = CAPTION_RE.exec(text);
  if (!m) return null;
  const style = p.style ?? '';
  const shortStandalone = text.length <= 140 && !/[.!?]$/.test(text.replace(/\)$/, ''));
  if (!/^Caption$/i.test(style) && !shortStandalone) return null;
  const kind: RefKind = /^table/i.test(m[1]) ? 'table' : 'figure';
  return { blockId: p.id, kind, number: parseInt(m[2], 10), text };
}

/** Scan the document for captions in document order. */
export function findCaptions(doc: QuillDocument): CaptionEntry[] {
  const captions: CaptionEntry[] = [];
  for (const s of doc.sections) {
    for (const b of s.blocks as Block[]) {
      if (b.type !== 'paragraph') continue;
      const cap = isCaption(b as Paragraph);
      if (cap) captions.push(cap);
    }
  }
  return captions;
}

/** Replace the first occurrence of `from` in the paragraph's runs. */
function replaceNumberInRuns(p: Paragraph, from: string, to: string): boolean {
  for (const run of p.textRuns) {
    const idx = run.text.indexOf(from);
    if (idx >= 0) {
      run.text = run.text.slice(0, idx) + to + run.text.slice(idx + from.length);
      return true;
    }
  }
  return false;
}

/**
 * Renumber captions in document order (figures and tables count
 * separately) and rewrite all in-text references to match.
 */
export function renumberReferences(doc: QuillDocument): { figures: number; tables: number; refsUpdated: number } {
  const counters: Record<RefKind, number> = { figure: 0, table: 0 };
  const remap = new Map<string, string>(); // `${blockId}` → new number

  // Pass 1: assign new numbers in order
  const captionParas: { para: Paragraph; cap: CaptionEntry; newNumber: number }[] = [];
  for (const s of doc.sections) {
    for (const b of s.blocks) {
      if (b.type !== 'paragraph') continue;
      const p = b as Paragraph;
      const cap = isCaption(p);
      if (!cap) continue;
      counters[cap.kind] += 1;
      captionParas.push({ para: p, cap, newNumber: counters[cap.kind] });
      remap.set(p.id, String(counters[cap.kind]));
    }
  }

  // Pass 2: rewrite caption numbers where they changed
  for (const { para, cap, newNumber } of captionParas) {
    if (cap.number !== newNumber) replaceNumberInRuns(para, String(cap.number), String(newNumber));
  }

  // Pass 3: update in-text references via old-number → position mapping.
  // Build old→new per kind from the caption sequence.
  const oldToNew: Record<RefKind, Map<string, string>> = { figure: new Map(), table: new Map() };
  const seen: Record<RefKind, number> = { figure: 0, table: 0 };
  for (const { cap, newNumber } of captionParas) {
    seen[cap.kind] += 1;
    oldToNew[cap.kind].set(String(cap.number), String(newNumber));
  }
  // Numbers never seen as captions keep identity
  let refsUpdated = 0;
  for (const s of doc.sections) {
    for (const b of s.blocks) {
      if (b.type !== 'paragraph') continue;
      const p = b as Paragraph;
      if (remap.has(p.id)) continue; // captions already handled
      for (const run of p.textRuns) {
        if (!/\b(figure|fig\.|table)\s+\d+\b/i.test(run.text)) continue;
        run.text = run.text.replace(REF_RE, (full, prefix: string, num: string) => {
          const kind: RefKind = /^table/i.test(prefix) ? 'table' : 'figure';
          const mapped = oldToNew[kind].get(num);
          if (!mapped || mapped === num) return full;
          refsUpdated += 1;
          return `${prefix}${mapped}`;
        });
      }
    }
  }

  return { figures: counters.figure, tables: counters.table, refsUpdated };
}

/** The next available number for a kind (used when inserting a reference). */
export function nextNumberFor(doc: QuillDocument, kind: RefKind): number {
  return findCaptions(doc).filter((c) => c.kind === kind).length + 1;
}
