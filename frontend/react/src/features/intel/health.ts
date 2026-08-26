/* ============================================================
   Document Health — rule-based analysis of structure, formatting,
   writing quality, accessibility and references. Deterministic
   and fully offline. Produces scored categories and clickable
   issues that can offer one-click fixes.
   ============================================================ */

import { QuillDocument, Paragraph, Table, ImageBlock, Block } from '../../engine/DocumentEngine';
import { analyzeText } from './readability';

export type HealthCategory = 'structure' | 'readability' | 'formatting' | 'grammar' | 'accessibility' | 'references';

export type HealthSeverity = 'info' | 'warning' | 'error';

export interface HealthIssue {
  id: string;
  category: HealthCategory;
  severity: HealthSeverity;
  title: string;
  detail: string;
  blockId?: string;
  /** Offered automatic fix, if any */
  fix?: {
    label: string;
    /** Applied by the caller via engine.transformDocument */
    apply: (doc: QuillDocument) => boolean;
  };
}

export interface CategoryScore {
  category: HealthCategory;
  score: number;
}

export interface HealthReport {
  overall: number;
  scores: CategoryScore[];
  issues: HealthIssue[];
  wordCount: number;
}

const CATEGORY_LABELS: Record<HealthCategory, string> = {
  structure: 'Structure',
  readability: 'Readability',
  formatting: 'Formatting',
  grammar: 'Grammar',
  accessibility: 'Accessibility',
  references: 'References',
};

export function categoryLabel(c: HealthCategory): string {
  return CATEGORY_LABELS[c];
}

const WEAK_WORDS = /\b(thing|stuff|nice|good|bad|very|really|a lot|kind of|sort of)\b/gi;
const PASSIVE = /\b(was|were|is|are|been|being)\s+\w+(ed|en)\b/gi;
const FILLERS = /\b(basically|actually|literally|just|quite|very)\b/gi;

function paraText(p: Paragraph): string {
  return p.textRuns.map((r) => r.text).join('');
}

function iterParas(doc: QuillDocument): { para: Paragraph; index: number }[] {
  const out: { para: Paragraph; index: number }[] = [];
  for (const s of doc.sections) {
    for (const b of s.blocks as Block[]) {
      if (b.type === 'paragraph') out.push({ para: b as Paragraph, index: out.length });
    }
  }
  return out;
}

function iterTables(doc: QuillDocument): Table[] {
  const out: Table[] = [];
  for (const s of doc.sections) {
    for (const b of s.blocks) if (b.type === 'table') out.push(b as Table);
  }
  return out;
}

function iterImages(doc: QuillDocument): ImageBlock[] {
  const out: ImageBlock[] = [];
  for (const s of doc.sections) {
    for (const b of s.blocks) if (b.type === 'image') out.push(b as ImageBlock);
  }
  return out;
}

/* ─── Checks ──────────────────────────────────────────────────────────────── */

function checkHeadingStructure(doc: QuillDocument): { issues: HealthIssue[]; penalty: number } {
  const issues: HealthIssue[] = [];
  let penalty = 0;
  let lastLevel = 0;
  const paras = iterParas(doc);

  for (const { para } of paras) {
    const style = para.style ?? 'Normal';
    const text = paraText(para).trim();
    if (!/^Heading\d$/.test(style) || !text) continue;
    const level = parseInt(style.replace('Heading', ''), 10);
    if (lastLevel && level > lastLevel + 1) {
      const targetLevel = Math.min(3, lastLevel + 1);
      issues.push({
        id: `heading-jump-${para.id}`,
        category: 'structure',
        severity: 'warning',
        title: 'Heading level jump',
        detail: `"${text}" jumps from Heading ${lastLevel} to Heading ${level}. Use consecutive levels for a clean outline.`,
        blockId: para.id,
        fix: {
          label: `Set to Heading ${targetLevel}`,
          apply: (d) => {
            for (const s of d.sections) {
              for (const b of s.blocks) {
                if (b.id === para.id && b.type === 'paragraph') {
                  (b as Paragraph).style = `Heading${targetLevel}`;
                  return true;
                }
              }
            }
            return false;
          },
        },
      });
      penalty += 4;
    }
    lastLevel = level;
  }

  // Empty headings
  for (const { para } of paras) {
    if (/^Heading\d$/.test(para.style ?? '') && !paraText(para).trim()) {
      issues.push({
        id: `heading-empty-${para.id}`,
        category: 'structure',
        severity: 'warning',
        title: 'Empty heading',
        detail: 'A heading has no text. Empty headings break the outline and navigation.',
        blockId: para.id,
      });
      penalty += 3;
    }
  }

  return { issues, penalty };
}

function checkFormatting(doc: QuillDocument): { issues: HealthIssue[]; penalty: number } {
  const issues: HealthIssue[] = [];
  let penalty = 0;
  const paras = iterParas(doc).filter(({ para }) => (para.style ?? 'Normal') === 'Normal');

  // Dominant font / size among body paragraphs
  const fontCounts = new Map<string, number>();
  const sizeCounts = new Map<number, number>();
  for (const { para } of paras) {
    for (const run of para.textRuns) {
      const f = run.formatting.fontFamily;
      const s = run.formatting.fontSize;
      if (f) fontCounts.set(f, (fontCounts.get(f) ?? 0) + 1);
      if (s) sizeCounts.set(s, (sizeCounts.get(s) ?? 0) + 1);
    }
  }
  const dominantFont = [...fontCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const dominantSize = [...sizeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  for (const { para } of paras) {
    for (const run of para.textRuns) {
      const f = run.formatting.fontFamily;
      const s = run.formatting.fontSize;
      if (dominantFont && f && f !== dominantFont && fontCounts.get(f)! <= 2) {
        issues.push({
          id: `font-${run.id}`,
          category: 'formatting',
          severity: 'info',
          title: 'Inconsistent font',
          detail: `"${f}" differs from the document's dominant body font "${dominantFont}".`,
          blockId: para.id,
          fix: {
            label: `Normalize to ${dominantFont}`,
            apply: (d) => {
              let changed = false;
              for (const sec of d.sections) {
                for (const b of sec.blocks) {
                  if (b.type !== 'paragraph') continue;
                  for (const r of (b as Paragraph).textRuns) {
                    if (r.formatting.fontFamily === f) {
                      r.formatting.fontFamily = dominantFont;
                      changed = true;
                    }
                  }
                }
              }
              return changed;
            },
          },
        });
        penalty += 2;
        break;
      }
      if (dominantSize && s && s !== dominantSize && sizeCounts.get(s)! <= 2) {
        issues.push({
          id: `size-${run.id}`,
          category: 'formatting',
          severity: 'info',
          title: 'Inconsistent font size',
          detail: `Size ${s}pt differs from the dominant body size ${dominantSize}pt.`,
          blockId: para.id,
          fix: {
            label: `Normalize to ${dominantSize}pt`,
            apply: (d) => {
              let changed = false;
              for (const sec of d.sections) {
                for (const b of sec.blocks) {
                  if (b.type !== 'paragraph') continue;
                  for (const r of (b as Paragraph).textRuns) {
                    if (r.formatting.fontSize === s) {
                      r.formatting.fontSize = dominantSize;
                      changed = true;
                    }
                  }
                }
              }
              return changed;
            },
          },
        });
        penalty += 2;
        break;
      }
    }
    if (issues.length >= 6) break;
  }

  // Odd text colors
  const colorCounts = new Map<string, number>();
  for (const { para } of paras) {
    for (const run of para.textRuns) {
      if (run.formatting.color) colorCounts.set(run.formatting.color, (colorCounts.get(run.formatting.color) ?? 0) + 1);
    }
  }
  const oddColors = [...colorCounts.entries()].filter(([c, n]) => n <= 1 && c.toLowerCase() !== '#000000');
  if (oddColors.length) {
    issues.push({
      id: 'colors-odd',
      category: 'formatting',
      severity: 'info',
      title: 'Stray text colors',
      detail: `${oddColors.length} run${oddColors.length > 1 ? 's' : ''} use one-off colors (${oddColors.map(([c]) => c).join(', ')}).`,
      fix: {
        label: 'Reset colors to automatic',
        apply: (d) => {
          let changed = false;
          for (const sec of d.sections) {
            for (const b of sec.blocks) {
              if (b.type !== 'paragraph') continue;
              for (const r of (b as Paragraph).textRuns) {
                if (oddColors.some(([c]) => r.formatting.color?.toLowerCase() === c.toLowerCase())) {
                  delete r.formatting.color;
                  changed = true;
                }
              }
            }
          }
          return changed;
        },
      },
    });
    penalty += 2;
  }

  // Excessive blank paragraphs
  const blanks = iterParas(doc).filter(({ para }) => !paraText(para).trim()).length;
  if (blanks >= 4) {
    issues.push({
      id: 'blank-paragraphs',
      category: 'formatting',
      severity: 'info',
      title: 'Extra blank lines',
      detail: `${blanks} empty paragraphs. Prefer paragraph spacing instead of blank lines.`,
      fix: {
        label: 'Remove blank paragraphs',
        apply: (d) => {
          let changed = false;
          for (const sec of d.sections) {
            sec.blocks = sec.blocks.filter((b) => {
              if (b.type !== 'paragraph') return true;
              const keep = paraText(b as Paragraph).trim().length > 0;
              if (!keep) changed = true;
              return keep;
            });
          }
          return changed;
        },
      },
    });
    penalty += 3;
  }

  return { issues, penalty };
}

function checkWriting(doc: QuillDocument): { issues: HealthIssue[]; penalty: number } {
  const issues: HealthIssue[] = [];
  let penalty = 0;
  const paras = iterParas(doc);

  for (const { para } of paras) {
    const text = paraText(para);
    if (!text.trim() || para.style !== 'Normal') continue;
    const sentences = text.match(/[^.!?]+[.!?]/g) ?? [];
    for (const s of sentences) {
      const wc = s.trim().split(/\s+/).length;
      if (wc > 34) {
        issues.push({
          id: `long-sentence-${para.id}-${issues.length}`,
          category: 'readability',
          severity: 'info',
          title: 'Very long sentence',
          detail: `"${s.trim().slice(0, 80)}…" is ${wc} words. Aim for under 25.`,
          blockId: para.id,
        });
        penalty += 2;
        break;
      }
    }
    const repeats = text.match(new RegExp('\\b(\\w{4,})\\s+\\1\\b', 'i'));
    if (repeats) {
      issues.push({
        id: `repeat-${para.id}`,
        category: 'grammar',
        severity: 'warning',
        title: 'Repeated word',
        detail: `"${repeats[0]}" — the same word appears twice in a row.`,
        blockId: para.id,
      });
      penalty += 2;
    }
  }

  const fullText = doc.sections.map((s) => s.blocks.map((b) => (b.type === 'paragraph' ? paraText(b as Paragraph) : '')).join(' ')).join(' ');
  const weak = fullText.match(WEAK_WORDS) ?? [];
  if (weak.length > 5) {
    issues.push({
      id: 'weak-words',
      category: 'readability',
      severity: 'info',
      title: 'Weak or filler wording',
      detail: `${weak.length} filler/weak words (e.g. "${[...new Set(weak.map((w) => w.toLowerCase()))].slice(0, 3).join('", "')}"). Tighten for impact.`,
    });
    penalty += 2;
  }
  const passiveMatches = fullText.match(PASSIVE) ?? [];
  if (passiveMatches.length > 6) {
    issues.push({
      id: 'passive-voice',
      category: 'readability',
      severity: 'info',
      title: 'Frequent passive voice',
      detail: `${passiveMatches.length} passive constructions detected. Prefer active voice where possible.`,
    });
    penalty += 2;
  }
  const fillers = fullText.match(FILLERS) ?? [];
  if (fillers.length > 8) {
    issues.push({
      id: 'fillers',
      category: 'readability',
      severity: 'info',
      title: 'Excessive filler words',
      detail: `${fillers.length} filler words such as "very", "really", "basically".`,
    });
    penalty += 1;
  }

  const stats = analyzeText(fullText);
  if (stats.words > 120 && stats.readingScore < 40) {
    issues.push({
      id: 'hard-to-read',
      category: 'readability',
      severity: 'warning',
      title: 'Difficult reading level',
      detail: `Flesch score ${stats.readingScore}/100 — sentences are long or words are complex.`,
    });
    penalty += 3;
  }

  return { issues, penalty };
}

function checkAccessibility(doc: QuillDocument): { issues: HealthIssue[]; penalty: number } {
  const issues: HealthIssue[] = [];
  let penalty = 0;

  const images = iterImages(doc);
  const noAlt = images.filter((i) => !i.altText || !i.altText.trim() || /^image\d*$/i.test(i.altText));
  if (noAlt.length) {
    issues.push({
      id: 'images-alt',
      category: 'accessibility',
      severity: 'warning',
      title: 'Images without alt text',
      detail: `${noAlt.length} image${noAlt.length > 1 ? 's' : ''} missing meaningful alt text. Screen readers can't describe them.`,
      blockId: noAlt[0].id,
      fix: {
        label: 'Add placeholder alt text',
        apply: (d) => {
          let n = 0;
          for (const sec of d.sections) {
            for (const b of sec.blocks) {
              if (b.type === 'image' && (!b.altText || /^image\d*$/i.test(b.altText))) {
                b.altText = `Figure image ${++n}`;
              }
            }
          }
          return n > 0;
        },
      },
    });
    penalty += 4;
  }

  const tables = iterTables(doc);
  const noHeader = tables.filter((t) => !t.headerRow && t.rows.length > 1);
  if (noHeader.length) {
    issues.push({
      id: 'tables-header',
      category: 'accessibility',
      severity: 'warning',
      title: 'Tables without header rows',
      detail: `${noHeader.length} table${noHeader.length > 1 ? 's' : ''} don't mark a header row.`,
      blockId: noHeader[0].id,
      fix: {
        label: 'Mark first row as header',
        apply: (d) => {
          let changed = false;
          for (const sec of d.sections) {
            for (const b of sec.blocks) {
              if (b.type === 'table' && !b.headerRow && b.rows.length > 1) {
                b.headerRow = true;
                if (b.rows[0]) b.rows[0].headerRow = true;
                changed = true;
              }
            }
          }
          return changed;
        },
      },
    });
    penalty += 3;
  }

  return { issues, penalty };
}

function checkReferences(doc: QuillDocument): { issues: HealthIssue[]; penalty: number } {
  const issues: HealthIssue[] = [];
  let penalty = 0;
  const paras = iterParas(doc);

  for (const { para } of paras) {
    for (const run of para.textRuns) {
      if (run.hyperlink && !/^(https?:\/\/|mailto:)/i.test(run.hyperlink.url)) {
        issues.push({
          id: `link-${run.id}`,
          category: 'references',
          severity: 'warning',
          title: 'Malformed link',
          detail: `"${run.hyperlink.url}" is not a valid http(s) or mailto link.`,
          blockId: para.id,
        });
        penalty += 3;
      }
    }
  }

  const unresolved = doc.comments.filter((c) => !c.resolved).length;
  if (unresolved > 0) {
    issues.push({
      id: 'unresolved-comments',
      category: 'references',
      severity: 'info',
      title: 'Unresolved comments',
      detail: `${unresolved} comment${unresolved > 1 ? 's' : ''} still open. Resolve them before sharing.`,
    });
    penalty += 1;
  }

  return { issues, penalty };
}

/* ─── Report ──────────────────────────────────────────────────────────────── */

export function analyzeHealth(doc: QuillDocument): HealthReport {
  const structure = checkHeadingStructure(doc);
  const formatting = checkFormatting(doc);
  const writing = checkWriting(doc);
  const accessibility = checkAccessibility(doc);
  const references = checkReferences(doc);

  const issues = [
    ...structure.issues, ...formatting.issues, ...writing.issues,
    ...accessibility.issues, ...references.issues,
  ];

  const fullText = doc.sections
    .map((s) => s.blocks.map((b) => (b.type === 'paragraph' ? paraText(b as Paragraph) : '')).join(' '))
    .join(' ');
  const stats = analyzeText(fullText);
  const wordCount = stats.words;

  // Base scores start high and lose points per issue; empty docs score neutral
  const clamp = (v: number) => Math.max(5, Math.min(100, Math.round(v)));
  const base = wordCount < 20 ? 90 : 100;

  const readabilityPenalty = writing.issues.filter((i) => i.category === 'readability').length * 3;
  const grammarPenalty = writing.issues.filter((i) => i.category === 'grammar').length * 4;
  const readabilityScore = wordCount < 20 ? 90 : clamp(100 - readabilityPenalty - (100 - stats.readingScore) * 0.25);

  const scores: CategoryScore[] = [
    { category: 'structure', score: clamp(base - structure.penalty) },
    { category: 'readability', score: readabilityScore },
    { category: 'formatting', score: clamp(base - formatting.penalty) },
    { category: 'grammar', score: clamp(base - grammarPenalty) },
    { category: 'accessibility', score: clamp(base - accessibility.penalty) },
    { category: 'references', score: clamp(base - references.penalty) },
  ];

  const overall = clamp(scores.reduce((a, s) => a + s.score, 0) / scores.length);
  return { overall, scores, issues, wordCount };
}

export { iterParas, iterTables, iterImages, paraText };
