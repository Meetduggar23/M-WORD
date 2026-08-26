/* ============================================================
   One-click cleanup — plans improvements, previews them, and
   applies them as a single undoable transform. Never silently
   modifies the document.
   ============================================================ */

import { QuillDocument, Paragraph, Table, Block } from '../../engine/DocumentEngine';

export interface CleanupAction {
  id: string;
  label: string;
  detail: string;
  apply: (doc: QuillDocument) => boolean;
}

function paraText(p: Paragraph): string {
  return p.textRuns.map((r) => r.text).join('');
}

function eachParagraph(doc: QuillDocument, fn: (p: Paragraph) => void): void {
  for (const s of doc.sections) {
    for (const b of s.blocks as Block[]) {
      if (b.type === 'paragraph') fn(b as Paragraph);
    }
  }
}

/** Analyze the document and plan the improvements it needs. */
export function planCleanup(doc: QuillDocument): CleanupAction[] {
  const actions: CleanupAction[] = [];
  const paras: Paragraph[] = [];
  eachParagraph(doc, (p) => paras.push(p));

  const bodyParas = paras.filter((p) => (p.style ?? 'Normal') === 'Normal');

  /* 1. Normalize fonts */
  const fontCounts = new Map<string, number>();
  for (const p of bodyParas) {
    for (const r of p.textRuns) {
      if (r.formatting.fontFamily) fontCounts.set(r.formatting.fontFamily, (fontCounts.get(r.formatting.fontFamily) ?? 0) + 1);
    }
  }
  const dominantFont = [...fontCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominantFont) {
    const oddFonts = [...fontCounts.keys()].filter((f) => f !== dominantFont);
    if (oddFonts.length) {
      actions.push({
        id: 'fonts',
        label: 'Normalize fonts',
        detail: `Body text uses ${oddFonts.join(', ')} alongside ${dominantFont}. Standardize on ${dominantFont}.`,
        apply: (d) => {
          let changed = false;
          eachParagraph(d, (p) => {
            for (const r of p.textRuns) {
              if (r.formatting.fontFamily && r.formatting.fontFamily !== dominantFont) {
                r.formatting.fontFamily = dominantFont;
                changed = true;
              }
            }
          });
          return changed;
        },
      });
    }
  }

  /* 2. Normalize font sizes */
  const sizeCounts = new Map<number, number>();
  for (const p of bodyParas) {
    for (const r of p.textRuns) {
      if (r.formatting.fontSize) sizeCounts.set(r.formatting.fontSize, (sizeCounts.get(r.formatting.fontSize) ?? 0) + 1);
    }
  }
  const dominantSize = [...sizeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominantSize) {
    const oddSizes = [...sizeCounts.keys()].filter((s) => s !== dominantSize);
    if (oddSizes.length) {
      actions.push({
        id: 'sizes',
        label: 'Normalize font sizes',
        detail: `Body sizes ${oddSizes.join(', ')}pt differ from the dominant ${dominantSize}pt.`,
        apply: (d) => {
          let changed = false;
          eachParagraph(d, (p) => {
            for (const r of p.textRuns) {
              if (r.formatting.fontSize && r.formatting.fontSize !== dominantSize) {
                r.formatting.fontSize = dominantSize;
                changed = true;
              }
            }
          });
          return changed;
        },
      });
    }
  }

  /* 3. Normalize paragraph spacing */
  const spacingCounts = new Map<string, number>();
  for (const p of bodyParas) {
    const key = `${p.formatting.spaceBefore}/${p.formatting.spaceAfter}`;
    spacingCounts.set(key, (spacingCounts.get(key) ?? 0) + 1);
  }
  const dominantSpacing = [...spacingCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominantSpacing && spacingCounts.size > 1) {
    const [sb, sa] = dominantSpacing.split('/').map(Number);
    actions.push({
      id: 'spacing',
      label: 'Normalize paragraph spacing',
      detail: `Most paragraphs use ${sb}/${sa}pt spacing — align the rest.`,
      apply: (d) => {
        let changed = false;
        eachParagraph(d, (p) => {
          if ((p.style ?? 'Normal') !== 'Normal') return;
          if (p.formatting.spaceBefore !== sb || p.formatting.spaceAfter !== sa) {
            p.formatting.spaceBefore = sb;
            p.formatting.spaceAfter = sa;
            changed = true;
          }
        });
        return changed;
      },
    });
  }

  /* 4. Remove blank paragraphs */
  if (paras.filter((p) => !paraText(p).trim()).length > 2) {
    actions.push({
      id: 'blanks',
      label: 'Remove unnecessary blank lines',
      detail: 'Empty paragraphs add uneven gaps; paragraph spacing already handles rhythm.',
      apply: (d) => {
        let changed = false;
        for (const s of d.sections) {
          const before = s.blocks.length;
          s.blocks = s.blocks.filter((b) => b.type !== 'paragraph' || paraText(b as Paragraph).trim().length > 0);
          if (s.blocks.length !== before) changed = true;
        }
        return changed;
      },
    });
  }

  /* 5. Fix heading level jumps */
  let lastLevel = 0;
  const jumps: { id: string; from: number; to: number }[] = [];
  for (const p of paras) {
    const style = p.style ?? 'Normal';
    if (!/^Heading\d$/.test(style) || !paraText(p).trim()) continue;
    const level = parseInt(style.replace('Heading', ''), 10);
    if (lastLevel && level > lastLevel + 1) jumps.push({ id: p.id, from: level, to: lastLevel + 1 });
    lastLevel = level;
  }
  if (jumps.length) {
    actions.push({
      id: 'headings',
      label: 'Fix heading hierarchy',
      detail: `${jumps.length} heading${jumps.length > 1 ? 's' : ''} skip a level (e.g. H1 → H3).`,
      apply: (d) => {
        let changed = false;
        for (const j of jumps) {
          for (const s of d.sections) {
            for (const b of s.blocks) {
              if (b.id === j.id && b.type === 'paragraph') {
                (b as Paragraph).style = `Heading${Math.min(3, j.to)}`;
                changed = true;
              }
            }
          }
        }
        return changed;
      },
    });
  }

  /* 6. Normalize stray colors */
  const colorCounts = new Map<string, number>();
  for (const p of bodyParas) {
    for (const r of p.textRuns) {
      if (r.formatting.color) colorCounts.set(r.formatting.color.toLowerCase(), (colorCounts.get(r.formatting.color.toLowerCase()) ?? 0) + 1);
    }
  }
  const stray = [...colorCounts.entries()].filter(([c, n]) => n <= 1 && c !== '#000000');
  if (stray.length) {
    actions.push({
      id: 'colors',
      label: 'Normalize colors',
      detail: `${stray.length} one-off colored run${stray.length > 1 ? 's' : ''} — reset to automatic.`,
      apply: (d) => {
        let changed = false;
        eachParagraph(d, (p) => {
          for (const r of p.textRuns) {
            if (r.formatting.color && stray.some(([c]) => r.formatting.color!.toLowerCase() === c)) {
              delete r.formatting.color;
              changed = true;
            }
          }
        });
        return changed;
      },
    });
  }

  /* 7. Fix inconsistent alignment in body text */
  const alignCounts = new Map<string, number>();
  for (const p of bodyParas) alignCounts.set(p.formatting.alignment, (alignCounts.get(p.formatting.alignment) ?? 0) + 1);
  const dominantAlign = [...alignCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominantAlign && dominantAlign === 'left' && alignCounts.size > 1) {
    const odd = [...alignCounts.entries()].filter(([a, n]) => a !== dominantAlign && n <= 1);
    if (odd.length) {
      actions.push({
        id: 'alignment',
        label: 'Fix inconsistent alignment',
        detail: `${odd.length} paragraph${odd.length > 1 ? 's' : ''} aligned differently from the body.`,
        apply: (d) => {
          let changed = false;
          const oddAligns = new Set(odd.map(([a]) => a));
          eachParagraph(d, (p) => {
            if ((p.style ?? 'Normal') !== 'Normal') return;
            if (oddAligns.has(p.formatting.alignment)) {
              p.formatting.alignment = 'left';
              changed = true;
            }
          });
          return changed;
        },
      });
    }
  }

  /* 8. Mark table header rows */
  const headerless = doc.sections.flatMap((s) => s.blocks).filter(
    (b): b is Table => b.type === 'table' && !(b as Table).headerRow && (b as Table).rows.length > 1,
  );
  if (headerless.length) {
    actions.push({
      id: 'table-headers',
      label: 'Add table header rows',
      detail: `${headerless.length} table${headerless.length > 1 ? 's' : ''} lack a marked header row.`,
      apply: (d) => {
        let changed = false;
        for (const s of d.sections) {
          for (const b of s.blocks) {
            if (b.type === 'table' && !b.headerRow && b.rows.length > 1) {
              b.headerRow = true;
              if (b.rows[0]) b.rows[0].headerRow = true;
              changed = true;
            }
          }
        }
        return changed;
      },
    });
  }

  return actions;
}

/** Apply a subset of actions as one undoable transform. Returns count applied. */
export function applyCleanup(
  engine: { transformDocument: (t: (doc: QuillDocument) => boolean) => boolean },
  actions: CleanupAction[],
): number {
  if (!actions.length) return 0;
  let applied = 0;
  engine.transformDocument((doc) => {
    for (const a of actions) {
      try {
        if (a.apply(doc)) applied += 1;
      } catch {
        /* a failing fix must not block the rest */
      }
    }
    // The transform is registered even if nothing changed — undo stays harmless.
    return true;
  });
  return applied;
}
