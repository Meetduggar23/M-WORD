import { describe, it, expect } from 'vitest';
import { analyzeHealth, paraText } from '../features/intel/health';
import { planCleanup } from '../features/intel/cleanup';
import { runDocumentTest } from '../features/intel/docTest';
import { renumberReferences, findCaptions, nextNumberFor } from '../features/intel/smartRefs';
import { analyzeTable } from '../features/intel/tableIntel';
import { inspectParagraph, collectParagraphs } from '../features/intel/designInspector';
import { QuillDocument, Paragraph, Table, TableRow, TableCell, RunFormatting } from '../engine/DocumentEngine';

/* ─── Builders ────────────────────────────────────────────────────────────── */

function para(id: string, text: string, style = 'Normal', formatting?: Partial<RunFormatting>): Paragraph {
  return {
    id,
    type: 'paragraph',
    textRuns: [{ id: `${id}-r`, text, formatting: { ...formatting } }],
    formatting: {
      alignment: 'left', leftIndent: 0, rightIndent: 0, firstLineIndent: 0, hangingIndent: 0,
      lineSpacing: 1, lineSpacingRule: 'auto', spaceBefore: 0, spaceAfter: 0,
      widowControl: true, keepWithNext: false, keepLinesTogether: false, pageBreakBefore: false,
      outlineLevel: 0, listFormat: { type: 'none', level: 0 },
      paragraphBorders: {}, paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      tabs: [], suppressHyphens: false, suppressLineNumbers: false, bidi: false,
      dropCap: { style: 'none' }, textDirection: 'ltr',
    },
    style,
    footnotes: [], endnotes: [],
  } as unknown as Paragraph;
}

function docOf(blocks: (Paragraph | Table)[]): QuillDocument {
  return {
    id: 'doc',
    sections: [{ id: 's', blocks, properties: {} }],
    metadata: { title: 'T' },
    comments: [],
    bookmarks: [],
    footnotes: [],
    endnotes: [],
  } as unknown as QuillDocument;
}

function cell(id: string, text: string): TableCell {
  return {
    id, textRuns: [{ id: `${id}-r`, text, formatting: {} }], paragraphs: [],
    rowSpan: 1, colSpan: 1, borders: {}, verticalAlignment: 'top',
    width: 100, cellWidthType: 'auto', shading: {} as TableCell['shading'],
    textDirection: 'ltr', margins: { top: 0, bottom: 0, left: 0, right: 0 }, noWrap: false,
  } as unknown as TableCell;
}

function table(id: string, rows: string[][]): Table {
  return {
    id, type: 'table',
    rows: rows.map((r, i) => ({
      id: `${id}-r${i}`, cells: r.map((c, j) => cell(`${id}-c${i}${j}`, c)),
      height: 0, heightType: 'auto', headerRow: i === 0, cantSplit: false, tableHeader: i === 0,
    })) as TableRow[],
    columnWidths: rows[0].map(() => 100),
    headerRow: true, tableBorders: {}, tableLook: {} as Table['tableLook'],
    indentation: 0, tableWidth: 0, tableWidthType: 'auto', overlap: false,
    cellMarginDefault: {} as Table['cellMarginDefault'], tableLayout: 'autofit', bidi: false,
  } as unknown as Table;
}

/* ─── Health ──────────────────────────────────────────────────────────────── */

describe('document health', () => {
  it('detects heading level jumps and offers a fix', () => {
    const doc = docOf([
      para('h1', 'Chapter', 'Heading1'),
      para('h2', 'Deep dive', 'Heading3'),
    ]);
    const report = analyzeHealth(doc);
    const jump = report.issues.find((i) => i.id.startsWith('heading-jump'));
    expect(jump).toBeDefined();
    expect(jump!.fix).toBeDefined();
    // Applying the fix changes the style
    const changed = jump!.fix!.apply(doc);
    expect(changed).toBe(true);
    expect((doc.sections[0].blocks[1] as Paragraph).style ?? '').toBe('Heading2');
  });

  it('flags extra blank paragraphs with a cleanup fix', () => {
    const doc = docOf([
      para('p1', 'First paragraph with content.'),
      para('b1', ''),
      para('b2', ''),
      para('b3', ''),
      para('b4', ''),
      para('p2', 'Second paragraph with content.'),
    ]);
    const report = analyzeHealth(doc);
    expect(report.issues.some((i) => i.id === 'blank-paragraphs')).toBe(true);
  });

  it('flags images without alt text', () => {
    const doc = docOf([para('p1', 'text')]);
    doc.sections[0].blocks.push({
      id: 'img1', type: 'image', src: 'x.png', altText: '', width: 10, height: 10,
      alignment: 'center', textWrapping: {} as never, rotation: 0, lockAspectRatio: true,
      effects: [], description: '', title: '',
    } as never);
    const report = analyzeHealth(doc);
    expect(report.issues.some((i) => i.id === 'images-alt')).toBe(true);
  });

  it('scores a clean document highly', () => {
    const doc = docOf([
      para('h1', 'Introduction', 'Heading1'),
      para('p1', 'This document is well written and clear.'),
      para('h2', 'Details', 'Heading2'),
      para('p2', 'All formatting is consistent and tidy.'),
    ]);
    const report = analyzeHealth(doc);
    expect(report.overall).toBeGreaterThanOrEqual(80);
  });

  it('paraText joins runs', () => {
    const p = para('x', '');
    (p.textRuns as { text: string }[]).push({ id: 'r2', text: 'B' } as never);
    (p.textRuns[0] as { text: string }).text = 'A';
    expect(paraText(p)).toBe('AB');
  });
});

/* ─── Cleanup ─────────────────────────────────────────────────────────────── */

describe('cleanup planner', () => {
  it('plans font normalization when body fonts diverge', () => {
    const doc = docOf([
      para('p1', 'Calibri body text here.', 'Normal', { fontFamily: 'Calibri' }),
      para('p2', 'Odd font here.', 'Normal', { fontFamily: 'Comic Sans MS' }),
    ]);
    const actions = planCleanup(doc);
    expect(actions.some((a) => a.id === 'fonts')).toBe(true);
    const fonts = actions.find((a) => a.id === 'fonts')!;
    expect(fonts.apply(doc)).toBe(true);
    expect(doc.sections[0].blocks.every((b) => (b as Paragraph).textRuns[0].formatting.fontFamily === 'Calibri')).toBe(true);
  });

  it('plans blank-line removal', () => {
    const doc = docOf([
      para('p1', 'Content one.'),
      para('b1', ''),
      para('b2', ''),
      para('b3', ''),
      para('p2', 'Content two.'),
    ]);
    const actions = planCleanup(doc);
    expect(actions.some((a) => a.id === 'blanks')).toBe(true);
  });

  it('plans nothing for a clean document', () => {
    const doc = docOf([
      para('p1', 'Clean consistent text.', 'Normal', { fontFamily: 'Calibri', fontSize: 11 }),
      para('p2', 'More clean text.', 'Normal', { fontFamily: 'Calibri', fontSize: 11 }),
    ]);
    expect(planCleanup(doc)).toHaveLength(0);
  });
});

/* ─── Document test ───────────────────────────────────────────────────────── */

describe('document test', () => {
  it('passes a healthy document', () => {
    const doc = docOf([
      para('h1', 'Title Section', 'Heading1'),
      para('p1', 'Some solid content for the test to measure.'),
    ]);
    const report = runDocumentTest(doc);
    expect(report.errors).toBe(0);
    expect(report.passed).toBeGreaterThan(5);
  });

  it('warns on empty headings and headerless tables', () => {
    const t = table('t1', [['A', 'B'], ['1', '2']]);
    t.headerRow = false;
    t.rows[0].headerRow = false;
    const doc = docOf([
      para('h1', 'OK Heading', 'Heading1'),
      para('h2', '', 'Heading2'),
      t,
    ]);
    const report = runDocumentTest(doc);
    const labels = report.results.filter((r) => r.status === 'warning').map((r) => r.label);
    expect(labels).toContain('No empty headings');
    expect(labels).toContain('Tables have headers');
  });
});

/* ─── Smart references ────────────────────────────────────────────────────── */

describe('smart references', () => {
  it('renumbers captions in order and updates references', () => {
    const doc = docOf([
      para('p1', 'See Figure 2 and Figure 7 below.'),
      para('c1', 'Figure 2: First diagram'),
      para('c2', 'Figure 7: Second diagram'),
    ]);
    const result = renumberReferences(doc);
    expect(result.figures).toBe(2);
    expect(result.refsUpdated).toBe(2);
    expect(paraText(doc.sections[0].blocks[0] as Paragraph)).toBe('See Figure 1 and Figure 2 below.');
    expect(paraText(doc.sections[0].blocks[1] as Paragraph)).toBe('Figure 1: First diagram');
    expect(paraText(doc.sections[0].blocks[2] as Paragraph)).toBe('Figure 2: Second diagram');
  });

  it('finds captions and next numbers', () => {
    const doc = docOf([
      para('c1', 'Table 1: Data'),
      para('c2', 'Figure 1: Chart'),
    ]);
    expect(findCaptions(doc)).toHaveLength(2);
    expect(nextNumberFor(doc, 'table')).toBe(2);
    expect(nextNumberFor(doc, 'figure')).toBe(2);
  });
});

/* ─── Table intelligence ──────────────────────────────────────────────────── */

describe('table intelligence', () => {
  const salesTable = table('sales', [
    ['Region', 'Revenue'],
    ['North', '1240000'],
    ['South', '820000'],
    ['East', '420000'],
    ['West', '830000'],
    ['Central', '795000'],
  ]);

  it('computes numeric stats per column', () => {
    const a = analyzeTable(salesTable);
    const revenue = a.columns_stats.find((c) => c.header === 'Revenue')!;
    expect(revenue.numeric).toBe(true);
    expect(revenue.min).toBe(420000);
    expect(revenue.max).toBe(1240000);
    expect(revenue.sum).toBe(4105000);
  });

  it('identifies highest and lowest rows', () => {
    const a = analyzeTable(salesTable);
    expect(a.highest?.rowLabel).toBe('North');
    expect(a.lowest?.rowLabel).toBe('East');
  });

  it('detects anomalies via z-score', () => {
    const spiky = table('spiky', [
      ['Month', 'Sales'],
      ['Jan', '100'],
      ['Feb', '105'],
      ['Mar', '20'],
      ['Apr', '98'],
      ['May', '102'],
      ['Jun', '99'],
    ]);
    const a = analyzeTable(spiky);
    expect(a.anomalies.length).toBeGreaterThan(0);
    expect(a.anomalies[0].rowLabel).toBe('Mar');
  });
});

/* ─── Design inspector ────────────────────────────────────────────────────── */

describe('design inspector', () => {
  it('reports consistency percentages for font and size', () => {
    const doc = docOf([
      para('p1', 'One', 'Normal', { fontFamily: 'Inter', fontSize: 13 }),
      para('p2', 'Two', 'Normal', { fontFamily: 'Inter', fontSize: 13 }),
      para('p3', 'Three', 'Normal', { fontFamily: 'Inter', fontSize: 15 }),
    ]);
    const inspection = inspectParagraph(doc, doc.sections[0].blocks[0] as Paragraph);
    const size = inspection.consistency.find((c) => c.label === 'Size')!;
    expect(size.percent).toBe(67);
    expect(size.divergentBlockIds).toEqual(['p3']);
  });

  it('collects paragraphs across sections', () => {
    const doc = docOf([para('p1', 'A'), para('p2', 'B')]);
    expect(collectParagraphs(doc)).toHaveLength(2);
  });
});
