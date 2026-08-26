/* ============================================================
   Markdown conversion — Document → Markdown export and
   Markdown → structured import. Pure functions over the
   engine's document model.
   ============================================================ */

import { QuillDocument, Paragraph, Table, ImageBlock, Block } from '../../engine/DocumentEngine';

function paraText(p: Paragraph): string {
  return p.textRuns
    .map((r) => {
      let t = r.text;
      if (!t) return '';
      if (r.formatting.bold && r.formatting.italic) t = `***${t}***`;
      else if (r.formatting.bold) t = `**${t}**`;
      else if (r.formatting.italic) t = `*${t}*`;
      if (r.formatting.strikethrough) t = `~~${t}~~`;
      if (r.hyperlink) t = `[${r.text}](${r.hyperlink.url})`;
      return t;
    })
    .join('');
}

function inlineToRuns(paragraph: Paragraph, text: string): void {
  // Parse **bold**, *italic*, `code`, [text](url), ~~strike~~ into runs
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const pushRun = (text: string, fmt: Partial<Paragraph['textRuns'][number]['formatting']>, hyperlink?: { url: string }): void => {
    if (!text) return;
    paragraph.textRuns.push({
      id: `${paragraph.id}-md-${paragraph.textRuns.length}`,
      text,
      formatting: { ...fmt },
      ...(hyperlink ? { hyperlink: { url: hyperlink.url } } : {}),
    } as Paragraph['textRuns'][number]);
  };

  while ((match = pattern.exec(text))) {
    pushRun(text.slice(last, match.index), {});
    const token = match[0];
    if (token.startsWith('***')) pushRun(token.slice(3, -3), { bold: true, italic: true });
    else if (token.startsWith('**')) pushRun(token.slice(2, -2), { bold: true });
    else if (token.startsWith('~~')) pushRun(token.slice(2, -2), { strikethrough: true });
    else if (token.startsWith('`')) pushRun(token.slice(1, -1), { fontFamily: 'Consolas' });
    else if (token.startsWith('[')) {
      const m = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (m) pushRun(m[1], {}, { url: m[2] });
    }
    last = match.index + token.length;
  }
  pushRun(text.slice(last), {});
}

/** Export a document to Markdown. */
export function exportMarkdown(doc: QuillDocument): string {
  const lines: string[] = [];

  for (const section of doc.sections) {
    for (const block of section.blocks as Block[]) {
      switch (block.type) {
        case 'paragraph': {
          const p = block as Paragraph;
          const text = paraText(p);
          const style = p.style ?? 'Normal';
          if (!text.trim()) {
            lines.push('');
            break;
          }
          if (style === 'Title') lines.push(`# ${text}`);
          else if (/^Heading\d$/.test(style)) {
            const level = Math.min(6, parseInt(style.replace('Heading', ''), 10) || 1);
            lines.push(`${'#'.repeat(level)} ${text}`);
          } else if (p.formatting?.listFormat?.type === 'bullet') {
            lines.push(`- ${text}`);
          } else if (p.formatting?.listFormat?.type === 'numbered') {
            lines.push(`1. ${text}`);
          } else {
            lines.push(text);
          }
          lines.push('');
          break;
        }
        case 'table': {
          const t = block as Table;
          if (!t.rows.length) break;
          const cellText = (row: typeof t.rows[number]) =>
            row.cells.map((c) => (c.textRuns.map((r) => r.text).join('') || '').replace(/\|/g, '\\|') || ' ');
          lines.push(`| ${cellText(t.rows[0]).join(' | ')} |`);
          lines.push(`| ${t.rows[0].cells.map(() => '---').join(' | ')} |`);
          for (const row of t.rows.slice(1)) lines.push(`| ${cellText(row).join(' | ')} |`);
          lines.push('');
          break;
        }
        case 'image': {
          const img = block as ImageBlock;
          lines.push(`![${img.altText || 'image'}](${img.src.startsWith('data:') ? '<embedded image>' : img.src})`);
          lines.push('');
          break;
        }
        case 'horizontalRule':
          lines.push('---', '');
          break;
        default:
          break;
      }
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/** Parsed markdown → a lightweight structure for document import. */
export interface MdBlock {
  kind: 'heading' | 'paragraph' | 'bullet' | 'numbered' | 'code' | 'quote' | 'hr' | 'table';
  level?: number;
  text: string;
  rows?: string[][];
}

export function parseMarkdown(md: string): MdBlock[] {
  const out: MdBlock[] = [];
  const lines = md.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      const lang = line.replace(/^\s*```/, '').trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      i++;
      out.push({ kind: 'code', text: code.join('\n'), level: 0 });
      if (lang) out[out.length - 1].text = `${lang}\n${code.join('\n')}`;
      continue;
    }

    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      out.push({ kind: 'hr', text: '' });
      i++;
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const rows: string[][] = [];
      const parseRow = (l: string) =>
        l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      rows.push(parseRow(line));
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(parseRow(lines[i++]));
      out.push({ kind: 'table', text: '', rows });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      out.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() });
      i++;
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      out.push({ kind: 'bullet', text: bullet[1] });
      i++;
      continue;
    }

    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      out.push({ kind: 'numbered', text: numbered[1] });
      i++;
      continue;
    }

    const quote = /^\s*>\s?(.*)$/.exec(line);
    if (quote) {
      out.push({ kind: 'quote', text: quote[1] });
      i++;
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph: gather consecutive plain lines
    const buf: string[] = [line.trim()];
    i++;
    while (
      i < lines.length && lines[i].trim() &&
      !/^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|```|\|)/.test(lines[i]) &&
      !/^\s*(---+|\*\*\*+|___+)\s*$/.test(lines[i])
    ) {
      buf.push(lines[i].trim());
      i++;
    }
    out.push({ kind: 'paragraph', text: buf.join(' ') });
  }
  return out;
}

export { inlineToRuns };
