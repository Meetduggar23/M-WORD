/* ============================================================
   Table Intelligence — deterministic numeric analysis of a
   table (min/max/sum/avg, trends, anomalies via z-score).
   AI summaries ride on top of this when a provider is set.
   ============================================================ */

import { QuillDocument, Table, Paragraph, Block } from '../../engine/DocumentEngine';

export interface ColumnStats {
  header: string;
  columnIndex: number;
  numeric: boolean;
  count: number;
  min?: number;
  max?: number;
  sum?: number;
  avg?: number;
}

export interface TableAnalysis {
  rows: number;
  columns: number;
  columns_stats: ColumnStats[];
  /** Highest value cells: { rowLabel, column, value } */
  highest?: { rowLabel: string; column: string; value: number };
  lowest?: { rowLabel: string; column: string; value: number };
  anomalies: { rowLabel: string; column: string; value: number; reason: string }[];
}

function cellText(table: Table, r: number, c: number): string {
  const row = table.rows[r];
  const cell = row?.cells[c];
  if (!cell) return '';
  const direct = cell.textRuns.map((x) => x.text).join('');
  if (direct.trim()) return direct.trim();
  return cell.paragraphs.map((p: Paragraph) => p.textRuns.map((x) => x.text).join('')).join(' ').trim();
}

function parseNumber(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[₹$€£,%\s]/g, '').replace(/,/g, '');
  const m = /^-?\d+(?:\.\d+)?$/.exec(cleaned);
  return m ? parseFloat(m[0]) : null;
}

export function findTableByBlockId(doc: QuillDocument, blockId: string): Table | undefined {
  for (const s of doc.sections) {
    for (const b of s.blocks as Block[]) {
      if (b.type === 'table' && b.id === blockId) return b as Table;
    }
  }
  return undefined;
}

/** Find the table containing/adjacent to a cursor block (same section scan). */
export function findNearestTable(doc: QuillDocument, blockId: string): Table | undefined {
  let lastTable: Table | undefined;
  for (const s of doc.sections) {
    for (const b of s.blocks) {
      if (b.type === 'table') {
        lastTable = b as Table;
        if (b.id === blockId) return lastTable;
      } else if (b.id === blockId && lastTable) {
        return lastTable;
      }
    }
  }
  return lastTable;
}

export function analyzeTable(table: Table): TableAnalysis {
  const rowCount = table.rows.length;
  const colCount = table.columnWidths.length || table.rows[0]?.cells.length || 0;
  const hasHeader = table.headerRow && rowCount > 1;
  const dataStart = hasHeader ? 1 : 0;
  const headerOf = (c: number) => (hasHeader ? cellText(table, 0, c) : `Column ${c + 1}`);
  const rowLabelOf = (r: number) => cellText(table, r, 0) || `Row ${r + 1}`;

  const stats: ColumnStats[] = [];
  for (let c = 0; c < colCount; c++) {
    const values: number[] = [];
    for (let r = dataStart; r < rowCount; r++) {
      const n = parseNumber(cellText(table, r, c));
      if (n !== null) values.push(n);
    }
    if (values.length >= Math.max(2, Math.floor((rowCount - dataStart) * 0.6))) {
      const sum = values.reduce((a, b) => a + b, 0);
      stats.push({
        header: headerOf(c),
        columnIndex: c,
        numeric: true,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        sum,
        avg: Math.round((sum / values.length) * 100) / 100,
      });
    } else {
      stats.push({ header: headerOf(c), columnIndex: c, numeric: false, count: values.length });
    }
  }

  // Highest / lowest across the first numeric column pair with a label column
  let highest: TableAnalysis['highest'];
  let lowest: TableAnalysis['lowest'];
  const firstNumeric = stats.find((s) => s.numeric);
  if (firstNumeric) {
    for (let r = dataStart; r < rowCount; r++) {
      const v = parseNumber(cellText(table, r, firstNumeric.columnIndex));
      if (v === null) continue;
      if (!highest || v > highest.value) highest = { rowLabel: rowLabelOf(r), column: firstNumeric.header, value: v };
      if (!lowest || v < lowest.value) lowest = { rowLabel: rowLabelOf(r), column: firstNumeric.header, value: v };
    }
  }

  // Anomalies: z-score > 2 within any numeric column
  const anomalies: TableAnalysis['anomalies'] = [];
  for (const col of stats.filter((s) => s.numeric && s.count >= 4)) {
    const values: { label: string; v: number }[] = [];
    for (let r = dataStart; r < rowCount; r++) {
      const v = parseNumber(cellText(table, r, col.columnIndex));
      if (v !== null) values.push({ label: rowLabelOf(r), v });
    }
    const mean = values.reduce((a, x) => a + x.v, 0) / values.length;
    const sd = Math.sqrt(values.reduce((a, x) => a + (x.v - mean) ** 2, 0) / values.length);
    if (sd === 0) continue;
    for (const { label, v } of values) {
      const z = (v - mean) / sd;
      if (Math.abs(z) > 2) {
        const pct = mean !== 0 ? Math.round(((v - mean) / Math.abs(mean)) * 100) : 0;
        anomalies.push({
          rowLabel: label,
          column: col.header,
          value: v,
          reason: `${pct > 0 ? 'higher' : 'lower'} than the column average by ${Math.abs(pct)}%`,
        });
      }
    }
  }

  return { rows: rowCount, columns: colCount, columns_stats: stats, highest, lowest, anomalies };
}

/** Format an analysis into readable text (used for AI context and display). */
export function describeAnalysis(a: TableAnalysis): string {
  const lines: string[] = [`Table: ${a.rows} rows x ${a.columns} columns.`];
  if (a.highest) lines.push(`Highest ${a.highest.column}: ${a.highest.rowLabel} (${a.highest.value}).`);
  if (a.lowest) lines.push(`Lowest ${a.lowest.column}: ${a.lowest.rowLabel} (${a.lowest.value}).`);
  for (const s of a.columns_stats.filter((x) => x.numeric)) {
    lines.push(`${s.header}: min ${s.min}, max ${s.max}, average ${s.avg}.`);
  }
  for (const an of a.anomalies) {
    lines.push(`Anomaly: ${an.rowLabel} — ${an.column} is ${an.reason}.`);
  }
  if (a.columns_stats.filter((x) => x.numeric).length >= 2) {
    const [first] = a.columns_stats.filter((x) => x.numeric);
    lines.push(`Column "${first.header}" totals ${first.sum}.`);
  }
  return lines.join('\n');
}
