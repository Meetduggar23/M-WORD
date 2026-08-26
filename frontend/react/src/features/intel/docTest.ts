/* ============================================================
   Document Test — a CI-style check suite for documents.
   Deterministic checks with pass / warning / error outcomes.
   ============================================================ */

import { QuillDocument, Paragraph, Table, ImageBlock, Block } from '../../engine/DocumentEngine';

export type TestStatus = 'pass' | 'warning' | 'error';

export interface TestResult {
  id: string;
  label: string;
  status: TestStatus;
  detail: string;
  blockId?: string;
}

export interface TestReport {
  results: TestResult[];
  passed: number;
  warnings: number;
  errors: number;
  total: number;
}

function paraText(p: Paragraph): string {
  return p.textRuns.map((r) => r.text).join('');
}

function blocks(doc: QuillDocument): Block[] {
  return doc.sections.flatMap((s) => s.blocks);
}

export function runDocumentTest(doc: QuillDocument): TestReport {
  const results: TestResult[] = [];
  const allBlocks = blocks(doc);
  const paras = allBlocks.filter((b): b is Paragraph => b.type === 'paragraph');

  /* 1. No broken links */
  const badLinks: string[] = [];
  for (const p of paras) {
    for (const r of p.textRuns) {
      if (r.hyperlink && !/^(https?:\/\/|mailto:)/i.test(r.hyperlink.url)) badLinks.push(r.hyperlink.url);
    }
  }
  results.push({
    id: 'links',
    label: 'No broken links',
    status: badLinks.length ? 'error' : 'pass',
    detail: badLinks.length ? `${badLinks.length} malformed link(s): ${badLinks.slice(0, 2).join(', ')}` : 'All links are well-formed http(s)/mailto URLs.',
  });

  /* 2. No empty headings */
  const emptyHeadings = paras.filter((p) => /^Heading\d$/.test(p.style ?? '') && !paraText(p).trim());
  results.push({
    id: 'empty-headings',
    label: 'No empty headings',
    status: emptyHeadings.length ? 'warning' : 'pass',
    detail: emptyHeadings.length ? `${emptyHeadings.length} heading(s) have no text.` : 'Every heading has content.',
  });

  /* 3. Heading hierarchy valid */
  let hierarchyOk = true;
  let lastLevel = 0;
  for (const p of paras) {
    const style = p.style ?? 'Normal';
    if (!/^Heading\d$/.test(style) || !paraText(p).trim()) continue;
    const level = parseInt(style.replace('Heading', ''), 10);
    if (lastLevel && level > lastLevel + 1) hierarchyOk = false;
    lastLevel = level;
  }
  results.push({
    id: 'hierarchy',
    label: 'Heading hierarchy valid',
    status: hierarchyOk ? 'pass' : 'warning',
    detail: hierarchyOk ? 'Heading levels increase without skips.' : 'At least one heading skips a level (e.g. H1 → H3).',
  });

  /* 4. All images have alt text */
  const images = allBlocks.filter((b): b is ImageBlock => b.type === 'image');
  const noAlt = images.filter((i) => !i.altText || !i.altText.trim() || /^image\d*$/i.test(i.altText));
  results.push({
    id: 'alt-text',
    label: 'All images have alt text',
    status: noAlt.length ? 'warning' : images.length ? 'pass' : 'pass',
    detail: noAlt.length ? `${noAlt.length} of ${images.length} image(s) missing alt text.` : images.length ? `${images.length} image(s) all described.` : 'No images in this document.',
    blockId: noAlt[0]?.id,
  });

  /* 5. Consistent fonts */
  const fontCounts = new Map<string, number>();
  const body = paras.filter((p) => (p.style ?? 'Normal') === 'Normal');
  for (const p of body) {
    for (const r of p.textRuns) {
      if (r.formatting.fontFamily) fontCounts.set(r.formatting.fontFamily, (fontCounts.get(r.formatting.fontFamily) ?? 0) + 1);
    }
  }
  const fonts = [...fontCounts.entries()].filter(([, n]) => n > 1);
  results.push({
    id: 'fonts',
    label: 'Consistent fonts',
    status: fonts.length > 1 ? 'warning' : 'pass',
    detail: fonts.length > 1
      ? `${fonts.length} fonts in body text: ${fonts.map(([f]) => f).join(', ')}.`
      : 'Body text uses a single font.',
  });

  /* 6. Tables have headers */
  const tables = allBlocks.filter((b): b is Table => b.type === 'table');
  const headerless = tables.filter((t) => !t.headerRow && t.rows.length > 1);
  results.push({
    id: 'table-headers',
    label: 'Tables have headers',
    status: headerless.length ? 'warning' : 'pass',
    detail: headerless.length ? `${headerless.length} table(s) without a header row.` : tables.length ? `${tables.length} table(s) all have headers.` : 'No tables in this document.',
    blockId: headerless[0]?.id,
  });

  /* 7. No unresolved comments */
  const open = doc.comments.filter((c) => !c.resolved);
  results.push({
    id: 'comments',
    label: 'No unresolved comments',
    status: open.length ? 'warning' : 'pass',
    detail: open.length ? `${open.length} comment(s) still open.` : 'All comments are resolved.',
  });

  /* 8. No orphaned references (footnotes/endnotes without markers is structural here) */
  const orphanFootnotes = doc.footnotes.filter((f) => !f.marker);
  results.push({
    id: 'references',
    label: 'No orphaned references',
    status: orphanFootnotes.length ? 'error' : 'pass',
    detail: orphanFootnotes.length ? `${orphanFootnotes.length} footnote(s) missing markers.` : 'Footnotes and endnotes are consistent.',
  });

  /* 9. Document has content */
  const wordCount = paras.reduce((a, p) => a + paraText(p).trim().split(/\s+/).filter(Boolean).length, 0);
  results.push({
    id: 'content',
    label: 'Document has content',
    status: wordCount > 0 ? 'pass' : 'warning',
    detail: wordCount > 0 ? `${wordCount.toLocaleString()} words.` : 'This document is empty.',
  });

  /* 10. Bookmarks referenced */
  const orphanBookmarks = doc.bookmarks.filter((bm) => !paras.some((p) => p.textRuns.some((r) => r.bookmark?.name === bm.name)));
  results.push({
    id: 'bookmarks',
    label: 'No orphaned bookmarks',
    status: orphanBookmarks.length && doc.bookmarks.length ? 'warning' : 'pass',
    detail: orphanBookmarks.length && doc.bookmarks.length ? `${orphanBookmarks.length} bookmark(s) not anchored in text.` : 'Bookmarks are anchored.',
  });

  const passed = results.filter((r) => r.status === 'pass').length;
  const warnings = results.filter((r) => r.status === 'warning').length;
  const errors = results.filter((r) => r.status === 'error').length;

  return { results, passed, warnings, errors, total: results.length };
}
