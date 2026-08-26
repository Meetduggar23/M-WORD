/* ============================================================
   Code support — language list and a tiny regex tokenizer for
   the code block preview. Deliberately dependency-free.
   ============================================================ */

export interface CodeLanguage {
  id: string;
  label: string;
}

export const CODE_LANGUAGES: CodeLanguage[] = [
  { id: 'plain', label: 'Plain text' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'json', label: 'JSON' },
  { id: 'xml', label: 'XML' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'dart', label: 'Dart' },
  { id: 'bash', label: 'Bash' },
];

export interface CodeToken {
  text: string;
  cls: 'kw' | 'str' | 'num' | 'com' | 'fn' | 'tag' | 'plain';
}

const KEYWORDS: Record<string, string[]> = {
  c: ['int', 'char', 'float', 'double', 'void', 'return', 'if', 'else', 'for', 'while', 'struct', 'typedef', 'const', 'static', 'sizeof', 'switch', 'case', 'break', 'continue', 'enum', 'union'],
  cpp: ['int', 'char', 'float', 'double', 'void', 'return', 'if', 'else', 'for', 'while', 'class', 'struct', 'public', 'private', 'protected', 'namespace', 'using', 'template', 'typename', 'const', 'auto', 'new', 'delete', 'try', 'catch', 'throw', 'virtual', 'override', 'bool', 'true', 'false', 'nullptr', 'std'],
  java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'int', 'long', 'double', 'float', 'boolean', 'char', 'String', 'new', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'import', 'package', 'this', 'super', 'null', 'true', 'false'],
  python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'with', 'try', 'except', 'finally', 'raise', 'lambda', 'None', 'True', 'False', 'and', 'or', 'not', 'in', 'is', 'pass', 'break', 'continue', 'yield', 'global', 'self', 'async', 'await'],
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'class', 'extends', 'new', 'this', 'typeof', 'instanceof', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'import', 'export', 'from', 'default', 'null', 'undefined', 'true', 'false', 'of', 'in'],
  typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'enum', 'extends', 'implements', 'new', 'this', 'typeof', 'keyof', 'try', 'catch', 'async', 'await', 'import', 'export', 'from', 'default', 'public', 'private', 'protected', 'readonly', 'static', 'null', 'undefined', 'true', 'false', 'string', 'number', 'boolean', 'any', 'unknown', 'never', 'void'],
  rust: ['fn', 'let', 'mut', 'const', 'struct', 'enum', 'impl', 'trait', 'pub', 'use', 'mod', 'match', 'if', 'else', 'for', 'while', 'loop', 'return', 'Some', 'None', 'Ok', 'Err', 'self', 'Self', 'where', 'dyn', 'async', 'await', 'move', 'ref', 'true', 'false'],
  go: ['func', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'defer', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'return', 'nil', 'true', 'false', 'string', 'int', 'error'],
  kotlin: ['fun', 'val', 'var', 'class', 'object', 'interface', 'data', 'sealed', 'when', 'if', 'else', 'for', 'while', 'return', 'null', 'true', 'false', 'is', 'in', 'as', 'companion', 'init', 'constructor', 'override', 'suspend', 'private', 'public', 'internal'],
  dart: ['var', 'final', 'const', 'class', 'extends', 'implements', 'with', 'void', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'new', 'this', 'super', 'null', 'true', 'false', 'async', 'await', 'Future', 'Stream', 'Widget'],
  bash: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'local', 'export', 'echo', 'cd', 'set', 'source'],
  sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UNION', 'WITH'],
  json: ['true', 'false', 'null'],
  xml: [],
  html: [],
  css: [],
  plain: [],
};

const C_LIKE_COMMENTS = ['c', 'cpp', 'java', 'javascript', 'typescript', 'rust', 'go', 'kotlin', 'dart', 'css', 'scss'];

/** Tokenize a line of code for preview highlighting. */
export function tokenizeCodeLine(line: string, lang: string): CodeToken[] {
  if (lang === 'plain') return [{ text: line, cls: 'plain' }];

  const tokens: CodeToken[] = [];
  const push = (text: string, cls: CodeToken['cls']) => {
    if (!text) return;
    const last = tokens[tokens.length - 1];
    if (last && last.cls === cls) last.text += text;
    else tokens.push({ text, cls });
  };

  const rest = line;

  if (lang === 'html' || lang === 'xml') {
    const parts = line.split(/(<\/?[a-zA-Z][^>]*>?)/g);
    for (const part of parts) {
      if (/^<\/?[a-zA-Z]/.test(part)) push(part, 'tag');
      else push(part, 'plain');
    }
    return tokens;
  }

  const pattern = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\/.*|#(?!\[).*$|--.*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(rest))) {
    push(rest.slice(lastIndex, match.index), 'plain');
    if (match[1]) push(match[1], 'str');
    else if (match[2]) push(match[2], 'com');
    else if (match[3]) push(match[3], 'num');
    else if (match[4]) {
      const word = match[4];
      const kws = KEYWORDS[lang] ?? KEYWORDS.javascript;
      const isKw = kws.includes(lang === 'sql' ? word.toUpperCase() : word);
      const nextChar = rest[match.index + word.length];
      if (isKw) push(word, 'kw');
      else if (nextChar === '(') push(word, 'fn');
      else push(word, 'plain');
    }
    lastIndex = match.index + match[0].length;
  }
  push(rest.slice(lastIndex), 'plain');
  return tokens;
}

export function languageLabel(id: string): string {
  return CODE_LANGUAGES.find((l) => l.id === id)?.label ?? id;
}

export { C_LIKE_COMMENTS };
