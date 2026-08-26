import { describe, expect, it } from 'vitest';
import { DocumentEngine } from '../engine/DocumentEngine';

describe('document export fidelity', () => {
  it('keeps the complete current document model in native export', () => {
    const engine = new DocumentEngine();
    const document = engine.getDocument();
    const paragraph = document.sections[0].blocks[0];
    if (paragraph.type !== 'paragraph') throw new Error('Expected the default paragraph');

    paragraph.textRuns = [
      { id: 'run-1', text: 'Normal ', formatting: {} },
      { id: 'run-2', text: 'formatted', formatting: { bold: true, italic: true, fontSize: 18, color: '#20509b' } },
    ];
    paragraph.formatting.alignment = 'center';
    paragraph.formatting.leftIndent = 48;
    paragraph.formatting.spaceAfter = 12;
    document.headers[0].paragraphs[0].textRuns = [{ id: 'header-run', text: 'Header', formatting: { italic: true } }];
    document.footers[0].paragraphs[0].textRuns = [{ id: 'footer-run', text: 'Footer', formatting: { bold: true } }];

    const roundTrip = JSON.parse(engine.serialize());
    expect(roundTrip.sections[0].blocks[0].textRuns).toEqual(paragraph.textRuns);
    expect(roundTrip.sections[0].blocks[0].formatting.alignment).toBe('center');
    expect(roundTrip.headers[0].paragraphs[0].textRuns[0].text).toBe('Header');
    expect(roundTrip.footers[0].paragraphs[0].textRuns[0].text).toBe('Footer');
  });

  it('maps formatted runs, paragraph layout, headers, footers and page numbers to HTML', () => {
    const engine = new DocumentEngine();
    const document = engine.getDocument();
    const paragraph = document.sections[0].blocks[0];
    if (paragraph.type !== 'paragraph') throw new Error('Expected the default paragraph');

    paragraph.textRuns = [
      { id: 'run-1', text: '<safe> ', formatting: { underline: true, highlight: '#fff2cc' } },
      { id: 'run-2', text: 'linked', formatting: { bold: true }, hyperlink: { url: 'https://example.com', tooltip: 'Example' } },
    ];
    paragraph.formatting.alignment = 'right';
    paragraph.formatting.leftIndent = 30;
    paragraph.formatting.pageBreakBefore = true;
    document.headers[0].paragraphs[0].textRuns = [{ id: 'header-run', text: 'Header', formatting: {} }];
    document.footers[0].paragraphs[0].textRuns = [{ id: 'footer-run', text: 'Footer', formatting: {} }];
    document.pageNumbers[0].show = true;

    const html = engine.exportAsHTML();
    expect(html).toContain('text-align:right');
    expect(html).toContain('padding-left:30px');
    expect(html).toContain('page-break-before:always');
    expect(html).toContain('text-decoration:underline');
    expect(html).toContain('background-color:#fff2cc');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('Header');
    expect(html).toContain('Footer');
    expect(html).toContain('counter(page)');
    expect(html).not.toContain('<safe>');
  });
});
