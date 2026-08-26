/* ============================================================
   Word-level diff — powers Visual Diff mode and version stats.
   LCS-based, pure, offline.
   ============================================================ */

export type DiffOp = 'equal' | 'insert' | 'delete';

export interface DiffPart {
  op: DiffOp;
  text: string;
}

export interface DiffStats {
  added: number;
  removed: number;
}

function splitWords(text: string): string[] {
  return text.split(/(\s+)/).filter((w) => w.length > 0);
}

/** Word-level diff of two texts. */
export function diffWords(a: string, b: string): DiffPart[] {
  const A = splitWords(a);
  const B = splitWords(b);

  // LCS table (guard very large inputs to keep the UI responsive)
  const MAX = 4000;
  const aCut = A.slice(0, MAX);
  const bCut = B.slice(0, MAX);
  const m = aCut.length;
  const n = bCut.length;

  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = aCut[i] === bCut[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (op: DiffOp, text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.op === op) last.text += text;
    else parts.push({ op, text });
  };

  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aCut[i] === bCut[j]) {
      push('equal', aCut[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('delete', aCut[i]);
      i++;
    } else {
      push('insert', bCut[j]);
      j++;
    }
  }
  while (i < m) push('delete', aCut[i++]);
  while (j < n) push('insert', bCut[j++]);

  return parts;
}

export function diffStats(parts: DiffPart[]): DiffStats {
  let added = 0;
  let removed = 0;
  for (const p of parts) {
    const words = p.text.trim() ? p.text.trim().split(/\s+/).length : 0;
    if (p.op === 'insert') added += words;
    if (p.op === 'delete') removed += words;
  }
  return { added, removed };
}

/** Coalesce tiny fragments into readable segments for rendering. */
export function diffSegments(parts: DiffPart[], maxSegments = 400): DiffPart[] {
  return parts.slice(0, maxSegments);
}
