import React, { useEffect, useMemo, useState } from 'react';
import {
  Code2, X, Copy, Check, Braces, FileCode2, CheckCircle2,
  AlertTriangle, Wrench, Minimize2, FolderTree, WrapText,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useToast } from '../toast/Toast';
import { CODE_LANGUAGES, languageLabel, tokenizeCodeLine } from '../../features/text/code';
import {
  validateJson, fixJson, formatJson, minifyJson, jsonToTree, JsonTreeNode,
} from '../../features/text/jsonTools';
import './smartDialogs.css';

interface CodeBlockDialogProps {
  initialTab?: 'code' | 'json';
  onClose: () => void;
}

type JsonView = 'edit' | 'tree';

export const CodeBlockDialog: React.FC<CodeBlockDialogProps> = ({ initialTab = 'code', onClose }) => {
  const engine = useDocumentEngine();
  const { toast } = useToast();
  const [tab, setTab] = useState<'code' | 'json'>(initialTab);

  /* ── Code tab ── */
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('javascript');
  const [wrap, setWrap] = useState(true);
  const [copied, setCopied] = useState(false);

  /* ── JSON tab ── */
  const [json, setJson] = useState('');
  const [jsonMessage, setJsonMessage] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [jsonView, setJsonView] = useState<JsonView>('edit');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const highlighted = useMemo(
    () => code.split('\n').map((line) => tokenizeCodeLine(line, lang)),
    [code, lang],
  );

  const jsonValidation = useMemo(() => validateJson(json), [json]);
  const jsonTree = useMemo(() => {
    if (!jsonValidation.ok) return null;
    try {
      return jsonToTree(JSON.parse(json));
    } catch {
      return null;
    }
  }, [json, jsonValidation.ok]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(tab === 'code' ? code : json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('error', 'Copy failed', 'Clipboard access was blocked.');
    }
  };

  /** Insert the block into the document: one Consolas paragraph per line. */
  const insertIntoDocument = (text: string, monospace: boolean) => {
    const lines = text.replace(/\r/g, '').split('\n');
    lines.forEach((line, i) => {
      if (i > 0) engine.insertParagraph();
      if (line) engine.insertText(line);
    });
    if (monospace) {
      // Select what we just inserted: from selection start back over the block
      engine.setFontFamily('Consolas');
    }
    toast('success', 'Inserted into document', monospace ? 'Formatted in Consolas.' : undefined);
    onClose();
  };

  const runJsonAction = (action: 'format' | 'validate' | 'fix' | 'minify') => {
    if (action === 'validate') {
      if (jsonValidation.ok) setJsonMessage({ kind: 'ok', text: 'Valid JSON.' });
      else setJsonMessage({ kind: 'error', text: `Line ${jsonValidation.issue?.line}: ${jsonValidation.issue?.message}` });
      return;
    }
    if (action === 'fix') {
      const { fixed, changes } = fixJson(json);
      const check = validateJson(fixed);
      setJson(fixed);
      setJsonMessage(
        check.ok
          ? { kind: 'ok', text: `Fixed${changes.length ? `: ${changes.join(', ').toLowerCase()}` : ''}.` }
          : { kind: 'error', text: `Auto-fix applied (${changes.join(', ').toLowerCase() || 'no changes'}) but issues remain: ${check.issue?.message}` },
      );
      return;
    }
    if (!jsonValidation.ok) {
      setJsonMessage({ kind: 'error', text: `Fix the JSON first — line ${jsonValidation.issue?.line}: ${jsonValidation.issue?.message}` });
      return;
    }
    try {
      setJson(action === 'format' ? formatJson(json) : minifyJson(json));
      setJsonMessage({ kind: 'ok', text: action === 'format' ? 'Formatted.' : 'Minified.' });
    } catch {
      setJsonMessage({ kind: 'error', text: 'Unexpected error while processing.' });
    }
  };

  const renderTree = (node: JsonTreeNode, depth = 0): React.ReactNode => (
    <div key={`${node.key}-${depth}-${Math.random()}`} className="json-tree-node" style={{ paddingLeft: depth ? 16 : 0 }}>
      <span className="json-tree-key">{node.key}</span>
      <span className="json-tree-colon">: </span>
      {node.children ? (
        <>
          <span className="json-tree-brace">{node.type === 'array' ? '[' : '{'}</span>
          {node.children.map((c) => renderTree(c, depth + 1))}
          <span className="json-tree-brace">{node.type === 'array' ? ']' : '}'}</span>
        </>
      ) : (
        <span className={`json-tree-value json-tree-${node.type}`}>
          {node.type === 'string' ? `"${node.value}"` : node.value}
        </span>
      )}
    </div>
  );

  return (
    <div className="sd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sd-dialog sd-wide" role="dialog" aria-modal="true" aria-label="Developer tools">
        <header className="sd-header">
          <span className="sd-header-icon"><Code2 size={15} strokeWidth={2} /></span>
          <div className="sd-title">
            Developer tools
            <div className="sd-subtitle">Code blocks, JSON utilities — all offline</div>
          </div>
          <div className="dev-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'code'} className={`dev-tab${tab === 'code' ? ' active' : ''}`} onClick={() => setTab('code')}>
              <FileCode2 size={13} strokeWidth={2} />
              Code block
            </button>
            <button role="tab" aria-selected={tab === 'json'} className={`dev-tab${tab === 'json' ? ' active' : ''}`} onClick={() => setTab('json')}>
              <Braces size={13} strokeWidth={2} />
              JSON tools
            </button>
          </div>
          <button className="sd-close" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </header>

        <div className="sd-body">
          {tab === 'code' ? (
            <div className="code-editor-wrap">
              <div className="code-toolbar">
                <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language" className="code-lang-select">
                  {CODE_LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
                <button className={`sd-btn${wrap ? ' sd-btn-primary' : ''}`} style={{ height: 24, padding: '0 9px', fontSize: 11 }} onClick={() => setWrap((w) => !w)} title="Toggle word wrap">
                  <WrapText size={11} strokeWidth={2.2} />
                  Wrap
                </button>
                <span className="code-meta">{code.split('\n').length} lines · {languageLabel(lang)}</span>
              </div>

              <div className="code-editor">
                <div className="code-gutter" aria-hidden="true">
                  {code.split('\n').map((_, i) => <div key={i} className="code-line-num">{i + 1}</div>)}
                </div>
                <div className="code-panes">
                  <textarea
                    className="code-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`Paste or write ${languageLabel(lang)} code…`}
                    spellCheck={false}
                    aria-label="Code editor"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {code && (
                    <pre className={`code-preview${wrap ? ' wrap' : ''}`} aria-hidden="true">
                      {highlighted.map((tokens, i) => (
                        <div key={i} className="code-line">
                          {tokens.map((t, j) => (
                            <span key={j} className={`tok-${t.cls}`}>{t.text}</span>
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="json-tools-wrap">
              <div className="code-toolbar">
                <button className="sd-btn" style={{ height: 24, padding: '0 9px', fontSize: 11 }} onClick={() => runJsonAction('format')}>Format</button>
                <button className="sd-btn" style={{ height: 24, padding: '0 9px', fontSize: 11 }} onClick={() => runJsonAction('validate')}>Validate</button>
                <button className="sd-btn" style={{ height: 24, padding: '0 9px', fontSize: 11 }} onClick={() => runJsonAction('fix')} title="Repair trailing commas, single quotes, comments, unquoted keys">
                  <Wrench size={11} strokeWidth={2.2} />
                  Fix
                </button>
                <button className="sd-btn" style={{ height: 24, padding: '0 9px', fontSize: 11 }} onClick={() => runJsonAction('minify')}>
                  <Minimize2 size={11} strokeWidth={2.2} />
                  Minify
                </button>
                <button
                  className={`sd-btn${jsonView === 'tree' ? ' sd-btn-primary' : ''}`}
                  style={{ height: 24, padding: '0 9px', fontSize: 11 }}
                  onClick={() => setJsonView((v) => (v === 'tree' ? 'edit' : 'tree'))}
                  disabled={!jsonTree}
                >
                  <FolderTree size={11} strokeWidth={2.2} />
                  Tree
                </button>
              </div>

              {jsonMessage && (
                <div className={`json-message json-${jsonMessage.kind}`}>
                  {jsonMessage.kind === 'ok' ? <CheckCircle2 size={13} strokeWidth={2.2} /> : <AlertTriangle size={13} strokeWidth={2.2} />}
                  {jsonMessage.text}
                </div>
              )}

              {jsonView === 'tree' && jsonTree ? (
                <div className="json-tree">{renderTree(jsonTree)}</div>
              ) : (
                <textarea
                  className="json-input"
                  value={json}
                  onChange={(e) => { setJson(e.target.value); setJsonMessage(null); }}
                  placeholder={'{\n  "name": "Meet",\n  "age": 21\n}'}
                  spellCheck={false}
                  aria-label="JSON editor"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              )}
            </div>
          )}
        </div>

        <footer className="sd-footer">
          <button className="sd-btn" onClick={copyCode} disabled={tab === 'code' ? !code : !json}>
            {copied ? <Check size={13} strokeWidth={2.4} /> : <Copy size={13} strokeWidth={2} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <span className="sd-footer-note" />
          <button className="sd-btn" onClick={onClose}>Cancel</button>
          <button
            className="sd-btn sd-btn-primary"
            onClick={() => insertIntoDocument(tab === 'code' ? code : json, tab === 'code')}
            disabled={tab === 'code' ? !code.trim() : !json.trim()}
          >
            Insert into document
          </button>
        </footer>
      </div>
    </div>
  );
};
