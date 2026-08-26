import { describe, it, expect } from 'vitest';
import {
  parseDocument, buildIndex, semanticSearch, retrieveForQuestion, tokenize,
} from '../features/brain/indexer';
import { QuillDocument, Paragraph, Section, Table, TableRow, TableCell } from '../engine/DocumentEngine';

function makeParagraph(id: string, text: string, style = 'Normal'): Paragraph {
  return {
    id,
    type: 'paragraph',
    textRuns: [{ id: `${id}-r`, text, formatting: {} }],
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

function makeDoc(blocks: (Paragraph | Table)[]): QuillDocument {
  const section: Section = {
    id: 'sec1',
    blocks,
    properties: {} as Section['properties'],
  };
  return {
    id: 'doc1',
    sections: [section],
    metadata: { title: 'Test Document' } as QuillDocument['metadata'],
  } as unknown as QuillDocument;
}

function makeCell(id: string, text: string): TableCell {
  return {
    id, textRuns: [{ id: `${id}-r`, text, formatting: {} }], paragraphs: [],
    rowSpan: 1, colSpan: 1, borders: {}, verticalAlignment: 'top',
    width: 100, cellWidthType: 'auto', shading: {} as TableCell['shading'],
    textDirection: 'ltr', margins: { top: 0, bottom: 0, left: 0, right: 0 }, noWrap: false,
  } as unknown as TableCell;
}

describe('tokenize', () => {
  it('removes stopwords and punctuation', () => {
    expect(tokenize('The traffic congestion is a big problem, very serious!'))
      .toEqual(['traffic', 'congestion', 'big', 'problem', 'serious']);
  });
});

describe('parseDocument', () => {
  it('extracts headings with hierarchy and body chunks', () => {
    const doc = makeDoc([
      makeParagraph('h1', 'Methodology', 'Heading1'),
      makeParagraph('p1', 'We collected traffic data from highway sensors.'),
      makeParagraph('h2', 'Data Collection', 'Heading2'),
      makeParagraph('p2', 'Sensors reported congestion every five minutes.'),
    ]);
    const chunks = parseDocument(doc);
    expect(chunks.map((c) => c.kind)).toEqual(['heading', 'paragraph', 'heading', 'paragraph']);
    const p2 = chunks.find((c) => c.blockId === 'p2')!;
    expect(p2.heading).toBe('Data Collection');
    expect(p2.headingPath).toEqual(['Methodology', 'Data Collection']);
  });

  it('indexes table content', () => {
    const table: Table = {
      id: 't1', type: 'table',
      rows: [
        { id: 'r1', cells: [makeCell('c1', 'Region'), makeCell('c2', 'Revenue')], height: 0, heightType: 'auto', headerRow: true, cantSplit: false, tableHeader: true },
        { id: 'r2', cells: [makeCell('c3', 'North'), makeCell('c4', '124000')], height: 0, heightType: 'auto', headerRow: false, cantSplit: false, tableHeader: false },
      ] as TableRow[],
      columnWidths: [100, 100], headerRow: true, tableBorders: {}, tableLook: {} as Table['tableLook'],
      indentation: 0, tableWidth: 0, tableWidthType: 'auto', overlap: false,
      cellMarginDefault: {} as Table['cellMarginDefault'], tableLayout: 'autofit', bidi: false,
    } as unknown as Table;
    const chunks = parseDocument(makeDoc([table]));
    const chunk = chunks.find((c) => c.blockId === 't1')!;
    expect(chunk.kind).toBe('table');
    expect(chunk.text).toContain('Region');
    expect(chunk.text).toContain('124000');
  });
});

describe('semantic search', () => {
  const doc = makeDoc([
    makeParagraph('h1', 'Traffic Analysis', 'Heading1'),
    makeParagraph('p1', 'Road congestion increased sharply in the city center during peak hours.'),
    makeParagraph('h2', 'Urban Mobility', 'Heading2'),
    makeParagraph('p2', 'Public transportation usage declined while car traffic grew.'),
    makeParagraph('h3', 'Budget', 'Heading2'),
    makeParagraph('p3', 'The annual infrastructure budget allocated funds for road maintenance.'),
  ]);
  const index = buildIndex(doc);

  it('finds the congestion paragraph for a road-congestion query', () => {
    const hits = semanticSearch(index, 'Where do I discuss road congestion?');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].chunk.blockId).toBe('p1');
  });

  it('ranks budget content for a spending query', () => {
    const hits = semanticSearch(index, 'infrastructure spending money allocation');
    expect(hits.length).toBeGreaterThan(0);
    expect(['p3', 'h3']).toContain(hits[0].chunk.blockId);
  });

  it('returns nothing for unrelated queries', () => {
    const hits = semanticSearch(index, 'quantum photosynthesis mitochondria');
    expect(hits.length).toBe(0);
  });

  it('retrieveForQuestion returns formatted context with sources', () => {
    const { chunks, contextText } = retrieveForQuestion(index, 'congestion in the city center');
    expect(chunks.length).toBeGreaterThan(0);
    expect(contextText).toMatch(/\[1\] \(page \d+/);
  });

  it('skips rebuild when fingerprint is unchanged', () => {
    const again = buildIndex(doc, index);
    expect(again).toBe(index);
  });
});
