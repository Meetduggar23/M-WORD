/* ============================================================
   Design Inspector — inspects the formatting of the current
   selection/paragraph and reports consistency across the document.
   ============================================================ */

import { QuillDocument, Paragraph, RunFormatting, Block } from '../../engine/DocumentEngine';

export interface ConsistencyStat {
  label: string;
  /** e.g. "13px" or "Calibri" */
  value: string;
  /** How many similar paragraphs share this exact value */
  matching: number;
  /** Total comparable paragraphs */
  total: number;
  /** Percentage 0-100 */
  percent: number;
  /** block ids of the differing paragraphs (for normalize) */
  divergentBlockIds: string[];
}

export interface DesignInspection {
  styleName: string;
  font: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  alignment: string;
  lineHeight: number;
  spaceBefore: number;
  spaceAfter: number;
  consistency: ConsistencyStat[];
}

function paraText(p: Paragraph): string {
  return p.textRuns.map((r) => r.text).join('');
}

export function collectParagraphs(doc: QuillDocument): Paragraph[] {
  return doc.sections.flatMap((s) => s.blocks as Block[]).filter((b): b is Paragraph => b.type === 'paragraph');
}

function fmtOf(p: Paragraph): RunFormatting {
  return p.textRuns[0]?.formatting ?? {};
}

/**
 * Inspect a paragraph and compute consistency of its font/size against
 * paragraphs sharing the same style.
 */
export function inspectParagraph(doc: QuillDocument, para: Paragraph): DesignInspection {
  const fmt = fmtOf(para);
  const pf = para.formatting;
  const styleName = para.style ?? 'Normal';
  const sameStyle = collectParagraphs(doc).filter((p) => (p.style ?? 'Normal') === styleName && paraText(p).trim());

  const consistency: ConsistencyStat[] = [];

  const statFor = (
    label: string,
    value: string,
    same: (p: Paragraph) => boolean,
  ): void => {
    const matching = sameStyle.filter(same).length;
    const total = sameStyle.length;
    const divergent = sameStyle.filter((p) => !same(p));
    consistency.push({
      label,
      value,
      matching,
      total,
      percent: total ? Math.round((matching / total) * 100) : 100,
      divergentBlockIds: divergent.map((p) => p.id),
    });
  };

  const font = fmt.fontFamily || 'Calibri';
  const size = fmt.fontSize || 11;

  statFor('Font', font, (p) => (fmtOf(p).fontFamily || 'Calibri') === font);
  statFor('Size', `${size}pt`, (p) => (fmtOf(p).fontSize || 11) === size);
  statFor('Line height', String(pf.lineSpacing ?? 1), (p) => (p.formatting.lineSpacing ?? 1) === (pf.lineSpacing ?? 1));
  if (styleName === 'Normal') {
    statFor('Spacing', `${pf.spaceBefore}/${pf.spaceAfter}pt`, (p) =>
      p.formatting.spaceBefore === pf.spaceBefore && p.formatting.spaceAfter === pf.spaceAfter);
  }

  return {
    styleName,
    font,
    fontSize: size,
    bold: !!fmt.bold,
    italic: !!fmt.italic,
    underline: !!fmt.underline,
    color: fmt.color || 'Automatic',
    alignment: pf.alignment,
    lineHeight: pf.lineSpacing ?? 1,
    spaceBefore: pf.spaceBefore,
    spaceAfter: pf.spaceAfter,
    consistency,
  };
}

/** Style usage summary across the document (for the inspector footer). */
export function styleUsage(doc: QuillDocument): { style: string; count: number; fontConsistency: number }[] {
  const paras = collectParagraphs(doc).filter((p) => paraText(p).trim());
  const byStyle = new Map<string, Paragraph[]>();
  for (const p of paras) {
    const s = p.style ?? 'Normal';
    byStyle.set(s, [...(byStyle.get(s) ?? []), p]);
  }
  return [...byStyle.entries()].map(([style, list]) => {
    const fonts = new Set(list.map((p) => fmtOf(p).fontFamily || 'Calibri'));
    return {
      style,
      count: list.length,
      fontConsistency: Math.round(((list.length - Math.max(0, fonts.size - 1)) / list.length) * 100),
    };
  }).sort((a, b) => b.count - a.count);
}

/** Normalize every paragraph of `styleName` to the given font/size. */
export function normalizeStyle(doc: QuillDocument, styleName: string, font: string, size: number): boolean {
  let changed = false;
  for (const s of doc.sections) {
    for (const b of s.blocks) {
      if (b.type !== 'paragraph') continue;
      const p = b as Paragraph;
      if ((p.style ?? 'Normal') !== styleName) continue;
      for (const r of p.textRuns) {
        if ((r.formatting.fontFamily || 'Calibri') !== font) {
          r.formatting.fontFamily = font;
          changed = true;
        }
        if ((r.formatting.fontSize || 11) !== size) {
          r.formatting.fontSize = size;
          changed = true;
        }
      }
    }
  }
  return changed;
}
