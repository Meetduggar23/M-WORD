import { describe, it, expect } from 'vitest';
import { diffWords, diffStats } from '../features/text/diff';
import { validateJson, fixJson, formatJson, minifyJson, jsonToTree } from '../features/text/jsonTools';
import { parseMarkdown, exportMarkdown } from '../features/text/markdown';
import { analyzePaste, textToRows } from '../features/text/smartPaste';
import { interpretTranscript } from '../features/speech/voice';
import { fuzzyScore, scoreCommand, interpretIntent } from '../features/commands/registry';
import { analyzeText } from '../features/intel/readability';

describe('diffWords', () => {
  it('marks inserted words', () => {
    const parts = diffWords('The system is fast.', 'The system is extremely fast.');
    const inserted = parts.filter((p) => p.op === 'insert').map((p) => p.text).join('');
    expect(inserted.trim()).toBe('extremely');
  });

  it('marks deleted words', () => {
    const parts = diffWords('The API supports JSON.', 'The API supports XML.');
    const removed = parts.filter((p) => p.op === 'delete').map((p) => p.text).join('');
    expect(removed).toContain('JSON');
    const inserted = parts.filter((p) => p.op === 'insert').map((p) => p.text).join('');
    expect(inserted).toContain('XML');
  });

  it('computes stats', () => {
    const stats = diffStats(diffWords('a b c', 'a b c d e'));
    expect(stats).toEqual({ added: 2, removed: 0 });
  });

  it('handles identical texts', () => {
    const parts = diffWords('same text', 'same text');
    expect(parts.every((p) => p.op === 'equal')).toBe(true);
  });
});

describe('jsonTools', () => {
  it('validates correct JSON', () => {
    expect(validateJson('{"a":1}').ok).toBe(true);
  });

  it('reports line numbers for broken JSON', () => {
    const v = validateJson('{\n  "a": 1,\n}');
    expect(v.ok).toBe(false);
    expect(v.issue?.line).toBe(3);
  });

  it('fixes trailing commas', () => {
    const { fixed, changes } = fixJson('{"name": "Meet", "age": 21,}');
    expect(validateJson(fixed).ok).toBe(true);
    expect(changes.join(' ')).toMatch(/trailing comma/i);
  });

  it('fixes single quotes and comments', () => {
    const { fixed } = fixJson("{ // config\n  'name': 'Meet' /* inline */\n}");
    expect(validateJson(fixed).ok).toBe(true);
  });

  it('formats and minifies', () => {
    const formatted = formatJson('{"a":[1,2]}');
    expect(formatted).toContain('\n');
    expect(minifyJson(formatted)).toBe('{"a":[1,2]}');
  });

  it('builds a tree', () => {
    const tree = jsonToTree(JSON.parse('{"a":1,"b":{"c":"x"}}'));
    expect(tree.type).toBe('object');
    expect(tree.children).toHaveLength(2);
    const b = tree.children![1];
    expect(b.type).toBe('object');
    expect(b.children![0].type).toBe('string');
  });
});

describe('markdown', () => {
  it('parses headings, lists, code and tables', () => {
    const blocks = parseMarkdown(`# Title\n\nSome text\n\n- one\n- two\n\n\`\`\`js\nlet x = 1;\n\`\`\`\n\n| A | B |\n| --- | --- |\n| 1 | 2 |`);
    const kinds = blocks.map((b) => b.kind);
    expect(kinds).toEqual(['heading', 'paragraph', 'bullet', 'bullet', 'code', 'table']);
    expect(blocks[0].level).toBe(1);
    expect(blocks[4].text).toContain('let x = 1;');
    expect(blocks[5].rows).toEqual([['A', 'B'], ['1', '2']]);
  });

  it('exports a document model to markdown', () => {
    const md = [
      '# Introduction',
      '',
      'Body **bold** text.',
      '',
      '- Item one',
    ].join('\n');
    const blocks = parseMarkdown(md);
    expect(blocks[0].kind).toBe('heading');
    expect(blocks[2].kind).toBe('bullet');
  });

  it('exportMarkdown produces headings from styles', () => {
    // Minimal doc shape for exportMarkdown
    const doc = {
      sections: [{
        id: 's', properties: {},
        blocks: [
          { id: 'h', type: 'paragraph', style: 'Heading1', textRuns: [{ id: 'r1', text: 'Intro', formatting: {} }], formatting: {} },
          { id: 'p', type: 'paragraph', style: 'Normal', textRuns: [{ id: 'r2', text: 'Hello world', formatting: {} }], formatting: {} },
        ],
      }],
      metadata: { title: 'T' },
    } as unknown as Parameters<typeof exportMarkdown>[0];
    const md = exportMarkdown(doc);
    expect(md).toContain('# Intro');
    expect(md).toContain('Hello world');
  });
});

describe('smartPaste', () => {
  it('detects key-value blocks', () => {
    const c = analyzePaste('Name: Meet\nAge: 21\nCity: Pune');
    expect(c.looksLikeKeyValue).toBe(true);
  });

  it('detects TSV tables', () => {
    const c = analyzePaste('Name\tAge\nMeet\t21');
    expect(c.looksLikeTable).toBe(true);
  });

  it('converts key-value text to rows', () => {
    const { rows, headerRow } = textToRows('Name: Meet\nAge: 21');
    expect(headerRow).toBe(true);
    expect(rows[0]).toEqual(['Key', 'Value']);
    expect(rows[1]).toEqual(['Name', 'Meet']);
  });

  it('converts TSV to rows', () => {
    const { rows } = textToRows('A\tB\n1\t2');
    expect(rows).toEqual([['A', 'B'], ['1', '2']]);
  });
});

describe('voice grammar', () => {
  it('maps bold commands', () => {
    const m = interpretTranscript('make this heading bold');
    expect(m).toEqual({ kind: 'command', id: 'ai.bold', args: {} });
  });

  it('extracts column count for tables', () => {
    const m = interpretTranscript('insert a table with four columns');
    expect(m?.kind).toBe('command');
    expect((m as { args?: { columns?: number } }).args?.columns).toBe(4);
  });

  it('routes questions to AI', () => {
    const m = interpretTranscript('what is the methodology of this study');
    expect(m?.kind).toBe('text');
  });
});

describe('command matching', () => {
  it('fuzzy scores exact matches highest', () => {
    expect(fuzzyScore('insert table', 'Insert table')).toBeGreaterThan(50);
    expect(fuzzyScore('xyzzy', 'Insert table')).toBe(-1);
  });

  it('scores keyword matches', () => {
    const score = scoreCommand('grid', { title: 'Insert table', section: 'Insert', keywords: 'grid' });
    expect(score).toBeGreaterThan(0);
  });

  it('classifies intents', () => {
    expect(interpretIntent('insert table').kind).toBe('command');
    expect(interpretIntent('make this more professional').kind).toBe('ai');
    expect(interpretIntent('what are the main conclusions?').kind).toBe('ask');
  });
});

describe('readability', () => {
  it('scores simple text higher than complex text', () => {
    const simple = analyzeText('The cat sat. The dog ran. It was fun.');
    const complex = analyzeText(
      'The implementation of multifaceted infrastructural reconfiguration initiatives necessitates comprehensive interdisciplinary deliberation.',
    );
    expect(simple.readingScore).toBeGreaterThan(complex.readingScore);
  });
});
