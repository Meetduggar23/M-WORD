/* ============================================================
   JSON tools — validate, format, minify, fix, and tree-view.
   The "fix" handles the most common real-world errors:
   trailing commas, single quotes, unquoted keys, comments.
   ============================================================ */

export interface JsonIssue {
  message: string;
  line: number;
}

export interface JsonValidation {
  ok: boolean;
  issue?: JsonIssue;
}

export function validateJson(text: string): JsonValidation {
  if (!text.trim()) return { ok: false, issue: { message: 'Empty input.', line: 1 } };
  try {
    JSON.parse(text);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON';
    const posMatch = /position (\d+)/.exec(message);
    let line = 1;
    if (posMatch) {
      line = text.slice(0, parseInt(posMatch[1], 10)).split('\n').length;
    }
    return { ok: false, issue: { message: humanizeJsonError(message), line } };
  }
}

function humanizeJsonError(raw: string): string {
  if (/Unexpected token .?},?/.test(raw) || /Unexpected token \}/.test(raw)) return 'Unexpected closing brace — check for a trailing comma.';
  if (/Unexpected token '/.test(raw)) return "Single quotes are not valid JSON — use double quotes.";
  if (/Unexpected token .* is not valid JSON/.test(raw) || /Unexpected identifier/.test(raw)) return 'Unquoted key or stray token — object keys must be double-quoted strings.';
  if (/Unexpected end of JSON input/.test(raw)) return 'Unexpected end of input — a bracket or brace is not closed.';
  return raw.replace(/^JSON\.parse: /, '');
}

/** Attempt automatic repair of common JSON mistakes. */
export function fixJson(text: string): { fixed: string; changes: string[] } {
  const changes: string[] = [];
  let out = text;

  // Remove // and /* */ comments (outside strings)
  const before = out;
  out = out.replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n\r]*|\/\*[\s\S]*?\*\//g, (_m0, str) => (str !== undefined ? str : ''));
  if (out !== before) changes.push('Removed comments');

  // Single-quoted strings → double-quoted (only outside double-quoted strings)
  out = out.replace(/("(?:[^"\\]|\\.)*")|'(?:[^'\\]|\\.)*'/g, (m, dq) => {
    if (dq !== undefined) return dq;
    changes.push('Converted single quotes to double quotes');
    return `"${m.slice(1, -1).replace(/"/g, '\\"')}"`;
  });

  // Quote unquoted object keys
  out = out.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, (_m0, pre, key, post) => {
    changes.push('Quoted unquoted keys');
    return `${pre}"${key}"${post}`;
  });

  // Trailing commas before } or ]
  const noTrailing = out.replace(/,(\s*[}\]])/g, '$1');
  if (noTrailing !== out) changes.push('Removed trailing commas');
  out = noTrailing;

  return { fixed: out, changes };
}

export function formatJson(text: string, indent = 2): string {
  return JSON.stringify(JSON.parse(text), null, indent);
}

export function minifyJson(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

/* ─── Tree view model ─────────────────────────────────────────────────────── */

export interface JsonTreeNode {
  key: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  value?: string;
  children?: JsonTreeNode[];
}

export function jsonToTree(value: unknown, key = 'root'): JsonTreeNode {
  if (value === null) return { key, type: 'null', value: 'null' };
  if (Array.isArray(value)) {
    return { key, type: 'array', children: value.map((v, i) => jsonToTree(v, String(i))) };
  }
  switch (typeof value) {
    case 'object':
      return {
        key,
        type: 'object',
        children: Object.entries(value as Record<string, unknown>).map(([k, v]) => jsonToTree(v, k)),
      };
    case 'string':
      return { key, type: 'string', value };
    case 'number':
      return { key, type: 'number', value: String(value) };
    case 'boolean':
      return { key, type: 'boolean', value: String(value) };
    default:
      return { key, type: 'null', value: String(value) };
  }
}
