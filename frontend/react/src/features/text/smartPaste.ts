/* ============================================================
   Smart Paste — detects foreign content and offers conversions.
   Transforms are pure: (input) → document-ready plain structure.
   ============================================================ */

export type PasteMode =
  | 'keep'          // keep formatting (insert as-is where possible)
  | 'match'         // match document (strip styles, keep structure)
  | 'plain'         // plain text
  | 'clean'         // clean formatting: strip junk styles, keep headings/lists/links/tables
  | 'table';        // convert to table (TSV / "Key: value" lines)

export interface PasteCandidate {
  /** Plain text of the clipboard content */
  text: string;
  /** text/html payload if present */
  html?: string;
  /** Heuristics */
  looksForeign: boolean;
  looksLikeTable: boolean;
  looksLikeKeyValue: boolean;
  looksLikeMarkdown: boolean;
  source: 'web' | 'pdf' | 'office' | 'ai-chat' | 'plain';
}

const JUNK_PROPS = /font-family|font-size|color|background|line-height|mso-|margin|text-indent/i;

export function analyzePaste(text: string, html?: string): PasteCandidate {
  const nonEmptyLines = text.split(/\r?\n/).filter((l) => l.trim());
  const tsvLines = nonEmptyLines.filter((l) => l.includes('\t'));
  const looksLikeTable = tsvLines.length >= 2 || (html?.includes('<table') ?? false);
  const kvLine = /^\s*[^:\n]{1,40}:\s*\S.*$/;
  const lines = nonEmptyLines;
  const looksLikeKeyValue = lines.length >= 2 && lines.slice(0, 6).every((l) => kvLine.test(l) || !l.trim());
  const looksLikeMarkdown = /^\s{0,3}#{1,6}\s/.test(text) || (/^\s*[-*]\s/m.test(text) && lines.length > 1) || /```/.test(text);

  let source: PasteCandidate['source'] = 'plain';
  if (html) {
    if (/mso-|MS Word|word/i.test(html)) source = 'office';
    else if (/class="ace"|chatgpt|openai|claude|gemini/i.test(html)) source = 'ai-chat';
    else if (/<p[^>]*>/i.test(html)) source = 'web';
  } else if (text && lines.some((l) => l.length > 200)) {
    source = 'pdf';
  }

  const looksForeign =
    !!html && JUNK_PROPS.test(html) ||
    looksLikeTable ||
    looksLikeKeyValue ||
    (source === 'web' && text.split(/\r?\n/).length > 2);

  return { text, html, looksForeign, looksLikeTable, looksLikeKeyValue, looksLikeMarkdown, source };
}

/* ─── HTML → clean structure (headings/lists/links/tables kept) ───────────── */

export interface CleanBlock {
  kind: 'heading' | 'paragraph' | 'bullet' | 'numbered' | 'code' | 'table';
  level?: number;
  text: string;
  rows?: string[][];
}

function decodeEntities(s: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}

function cleanText(el: Node): string {
  let out = '';
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? '';
    else if (n.nodeType === Node.ELEMENT_NODE) {
      const tag = (n as Element).tagName.toLowerCase();
      if (tag === 'br') out += '\n';
      else if (tag === 'a') out += (n as Element).textContent ?? '';
      else out += cleanText(n);
    }
  });
  return out;
}

/** Convert pasted HTML into clean structural blocks, dropping junk styling. */
export function htmlToCleanBlocks(html: string): CleanBlock[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript, svg, iframe').forEach((el) => el.remove());
  const blocks: CleanBlock[] = [];

  const walk = (node: Element): void => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      const heading = /^h([1-6])$/.exec(tag);
      if (heading) {
        blocks.push({ kind: 'heading', level: parseInt(heading[1], 10), text: cleanText(child).trim() });
      } else if (tag === 'table') {
        const rows: string[][] = [];
        child.querySelectorAll('tr').forEach((tr) => {
          const cells: string[] = [];
          tr.querySelectorAll('th,td').forEach((td) => cells.push(cleanText(td).trim()));
          if (cells.length) rows.push(cells);
        });
        if (rows.length) blocks.push({ kind: 'table', text: '', rows });
      } else if (tag === 'ul' || tag === 'ol') {
        child.querySelectorAll(':scope > li').forEach((li) => {
          blocks.push({ kind: tag === 'ul' ? 'bullet' : 'numbered', text: cleanText(li).trim() });
        });
      } else if (tag === 'pre') {
        blocks.push({ kind: 'code', text: child.textContent ?? '' });
      } else if (['p', 'div', 'section', 'article', 'blockquote', 'main'].includes(tag)) {
        const text = cleanText(child).trim();
        if (child.children.length && ['div', 'section', 'article', 'main'].includes(tag)) {
          walk(child);
        } else if (text) {
          blocks.push({ kind: 'paragraph', text });
        }
      } else {
        const text = cleanText(child).trim();
        if (text) blocks.push({ kind: 'paragraph', text });
      }
    }
  };

  walk(doc.body);
  if (!blocks.length) {
    const text = doc.body.textContent?.trim();
    if (text) blocks.push({ kind: 'paragraph', text });
  }
  return blocks;
}

/** Plain text → table rows (TSV first, then "Key: value"). */
export function textToRows(text: string): { rows: string[][]; headerRow: boolean } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.some((l) => l.includes('\t'))) {
    return { rows: lines.map((l) => l.split('\t').map((c) => c.trim())), headerRow: true };
  }
  const kv = lines
    .map((l) => /^\s*([^:\n]{1,40}):\s*(.*)$/.exec(l))
    .filter((m): m is RegExpExecArray => !!m);
  if (kv.length >= 2 && kv.length >= lines.length - 1) {
    return { rows: [['Key', 'Value'], ...kv.map((m) => [m[1].trim(), m[2].trim()])], headerRow: true };
  }
  return { rows: lines.map((l) => [l.trim()]), headerRow: false };
}

export { decodeEntities };
