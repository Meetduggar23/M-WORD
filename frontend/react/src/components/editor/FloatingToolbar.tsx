import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, MessageSquarePlus, Sparkles,
  Table as TableIcon, ChartColumnBig, TrendingUp, ShieldAlert, Sigma, X,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import { useToast } from '../toast/Toast';
import { InlineAIMenu, SuggestionCard, InlineAIStatus, useInlineAI } from '../ai/inlineAI';
import { aiService } from '../../features/ai/aiService';
import { analyzeTable, describeAnalysis, findNearestTable } from '../../features/intel/tableIntel';
import { AIProviderError } from '../../features/ai/types';
import './FloatingToolbar.css';

const FONTS = ['Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Consolas'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

type TablePanel =
  | { kind: 'analysis'; text: string }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | null;

/**
 * Contextual formatting bar shown above the current text selection,
 * with inline AI actions and table intelligence.
 */
export const FloatingToolbar: React.FC = () => {
  const engine = useDocumentEngine();
  const ui = useUI();
  const { toast } = useToast();
  const { activeFormatting: fmt, selection } = engine;
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const inline = useInlineAI();
  const [tablePanel, setTablePanel] = useState<TablePanel>(null);

  const visible = !selection.isCollapsed;

  const nearTable = useMemo(() => {
    if (!visible || !engine.document) return null;
    return findNearestTable(engine.document, selection.start.blockId) ?? null;
  }, [visible, engine.document, selection.start.blockId]);

  useLayoutEffect(() => {
    if (!visible) {
      setPos(null);
      return;
    }
    // Prefer the live DOM selection rect; fall back to the anchor paragraph
    let rect: DOMRect | null = null;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      }
    } catch {
      /* ignore */
    }
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      const blockEl = document.querySelector(`[data-block-id="${selection.start.blockId}"]`);
      if (blockEl) rect = blockEl.getBoundingClientRect();
    }
    if (!rect) return;

    const BAR_H = 42;
    const BAR_W = 500;
    const top = Math.max(8, rect.top - BAR_H - 8);
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - BAR_W / 2),
      window.innerWidth - BAR_W - 8,
    );
    setPos({ top, left });
  }, [visible, selection.start.blockId, selection.end.blockId]);

  useEffect(() => {
    if (!visible) return;
    const closeOnScroll = () => setPos(null);
    window.addEventListener('wheel', closeOnScroll, { passive: true });
    return () => window.removeEventListener('wheel', closeOnScroll);
  }, [visible]);

  // Close menus when the selection collapses
  useEffect(() => {
    if (!visible) {
      setAiMenuOpen(false);
      setTableMenuOpen(false);
    }
  }, [visible]);

  if (!visible || !pos) return null;

  const applySuggestion = (mode: 'replace' | 'below') => {
    if (!inline.suggestion) return;
    if (mode === 'replace') {
      engine.deleteBackward();
      engine.insertText(inline.suggestion.suggested);
    } else {
      // move caret to end of selection, then insert a new paragraph with the text
      engine.setSelection(engine.selection.end, engine.selection.end);
      engine.insertParagraph();
      engine.insertText(inline.suggestion.suggested);
    }
    inline.dismiss();
    toast('success', mode === 'replace' ? 'Selection replaced' : 'Inserted below');
  };

  const runTranslate = () => {
    setAiMenuOpen(false);
    const lang = window.prompt('Translate to which language?', 'English');
    if (lang) void inline.run(`Translate this to ${lang}. Keep formatting and names intact.`);
  };

  const runTableAction = async (action: 'analyze' | 'summarize' | 'anomalies' | 'chart') => {
    setTableMenuOpen(false);
    if (!nearTable) return;
    if (action === 'chart') {
      const numericCols = analyzeTable(nearTable).columns_stats.filter((c) => c.numeric);
      if (!numericCols.length) {
        toast('info', 'No numeric columns', 'Add numeric data before creating a chart.');
        return;
      }
      engine.insertChart('column');
      toast('success', 'Chart inserted', 'A column chart was added after the table.');
      return;
    }
    if (action === 'analyze' || action === 'anomalies') {
      const analysis = analyzeTable(nearTable);
      const lines = describeAnalysis(analysis).split('\n');
      const filtered = action === 'anomalies'
        ? lines.filter((l) => l.startsWith('Anomaly:') || l.startsWith('Table:'))
        : lines;
      setTablePanel({
        kind: 'analysis',
        text: action === 'anomalies' && !filtered.some((l) => l.startsWith('Anomaly:'))
          ? 'No anomalies found — values stay within normal variation.'
          : filtered.join('\n'),
      });
      return;
    }
    // summarize — via AI provider with the table as context
    setTablePanel({ kind: 'loading' });
    try {
      const tableText = nearTable.rows
        .map((row) => row.cells.map((c) => c.textRuns.map((r) => r.text).join('')).join(' | '))
        .join('\n');
      const out = await aiService.complete([
        { role: 'system', content: 'Summarize the key takeaways of this table in 3-5 concise bullets. Reply with the bullets only.' },
        { role: 'user', content: tableText },
      ]);
      setTablePanel({ kind: 'analysis', text: out.trim() });
    } catch (e) {
      setTablePanel({
        kind: 'error',
        message: e instanceof AIProviderError ? e.message : 'The AI request failed.',
      });
    }
  };

  const BAR_H = 42;

  return (
    <>
      <div
        ref={barRef}
        className="floating-toolbar"
        style={{ top: pos.top, left: pos.left }}
        role="toolbar"
        aria-label="Text formatting"
        onMouseDown={(e) => {
          const tag = (e.target as HTMLElement).tagName;
          if (tag !== 'SELECT' && tag !== 'INPUT' && tag !== 'OPTION') e.preventDefault();
        }}
      >
        <select
          className="ft-select ft-font"
          value={fmt.fontFamily || 'Calibri'}
          onChange={(e) => engine.setFontFamily(e.target.value)}
          aria-label="Font"
          title="Font"
        >
          {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          className="ft-select ft-size"
          value={fmt.fontSize || 11}
          onChange={(e) => engine.setFontSize(Number(e.target.value))}
          aria-label="Font size"
          title="Font size"
        >
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <span className="ft-divider" />

        <button className={`ft-btn${fmt.bold ? ' active' : ''}`} onClick={() => engine.toggleBold()} title="Bold (Ctrl+B)" aria-label="Bold">
          <Bold size={14} strokeWidth={2.4} />
        </button>
        <button className={`ft-btn${fmt.italic ? ' active' : ''}`} onClick={() => engine.toggleItalic()} title="Italic (Ctrl+I)" aria-label="Italic">
          <Italic size={14} strokeWidth={2.4} />
        </button>
        <button className={`ft-btn${fmt.underline ? ' active' : ''}`} onClick={() => engine.toggleUnderline()} title="Underline (Ctrl+U)" aria-label="Underline">
          <Underline size={14} strokeWidth={2.4} />
        </button>
        <button className={`ft-btn${fmt.strikethrough ? ' active' : ''}`} onClick={() => engine.toggleStrikethrough()} title="Strikethrough" aria-label="Strikethrough">
          <Strikethrough size={14} strokeWidth={2.4} />
        </button>

        <span className="ft-divider" />

        <label className="ft-color" title="Text color" aria-label="Text color">
          <span className="ft-color-letter">A</span>
          <input
            type="color"
            value={fmt.color || '#17191c'}
            onChange={(e) => engine.setTextColor(e.target.value)}
          />
        </label>
        <label className="ft-color" title="Highlight" aria-label="Highlight color">
          <span className="ft-color-marker" />
          <input
            type="color"
            value={fmt.highlight || '#ffe066'}
            onChange={(e) => engine.setHighlight(e.target.value)}
          />
        </label>

        <span className="ft-divider" />

        <button
          className="ft-btn"
          onClick={() => {
            const text = engine.getSelectedText().trim();
            if (text) engine.addComment(text.slice(0, 80));
            ui.toggleRightPanel('comments');
          }}
          title="Comment on selection"
          aria-label="Add comment"
        >
          <MessageSquarePlus size={14} strokeWidth={2.1} />
        </button>

        {/* Table intelligence — only when the selection touches a table */}
        {nearTable && (
          <div className="ft-menu-wrap">
            <button
              className={`ft-btn${tableMenuOpen || tablePanel ? ' active' : ''}`}
              onClick={() => { setTableMenuOpen((o) => !o); setAiMenuOpen(false); }}
              title="Table intelligence"
              aria-label="Table intelligence"
              aria-expanded={tableMenuOpen}
            >
              <TableIcon size={14} strokeWidth={2.1} />
            </button>
            {tableMenuOpen && (
              <div className="ft-menu" role="menu" aria-label="Table AI tools">
                <button className="ft-menu-item" role="menuitem" onClick={() => void runTableAction('analyze')}>
                  <Sigma size={13} strokeWidth={2} /> Analyze table
                </button>
                <button className="ft-menu-item" role="menuitem" onClick={() => void runTableAction('summarize')}>
                  <Sparkles size={13} strokeWidth={2} /> Summarize
                </button>
                <button className="ft-menu-item" role="menuitem" onClick={() => void runTableAction('anomalies')}>
                  <ShieldAlert size={13} strokeWidth={2} /> Find anomalies
                </button>
                <button className="ft-menu-item" role="menuitem" onClick={() => void runTableAction('chart')}>
                  <ChartColumnBig size={13} strokeWidth={2} /> Create chart
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inline AI actions */}
        <div className="ft-menu-wrap">
          <button
            className={`ft-btn ft-btn-ai${aiMenuOpen || inline.suggestion ? ' active' : ''}`}
            onClick={() => { setAiMenuOpen((o) => !o); setTableMenuOpen(false); }}
            title="AI actions for selection"
            aria-label="AI actions"
            aria-expanded={aiMenuOpen}
          >
            <Sparkles size={14} strokeWidth={2.1} />
          </button>
          {aiMenuOpen && (
            <InlineAIMenu
              onRun={(instruction) => {
                setAiMenuOpen(false);
                void inline.run(instruction);
              }}
              onTranslate={runTranslate}
            />
          )}
        </div>
      </div>

      {/* Inline AI states — anchored under the toolbar */}
      {pos && (inline.loading || inline.error) && (
        <div style={{ position: 'fixed', top: pos.top + BAR_H + 6, left: pos.left, zIndex: 901 }}>
          <InlineAIStatus
            loading={inline.loading}
            error={inline.error}
            onRetry={() => void inline.retry()}
            onDismiss={inline.dismiss}
            onOpenSettings={() => {
              inline.dismiss();
              ui.openDialog('settings');
            }}
          />
        </div>
      )}

      {pos && inline.suggestion && (
        <SuggestionCard
          suggestion={inline.suggestion}
          style={{ top: pos.top + BAR_H + 6, left: pos.left }}
          onReplace={() => applySuggestion('replace')}
          onInsertBelow={() => applySuggestion('below')}
          onDismiss={inline.dismiss}
        />
      )}

      {/* Table analysis panel */}
      {tablePanel && pos && (
        <div className="ft-table-panel" style={{ top: pos.top + BAR_H + 6, left: pos.left }} role="dialog" aria-label="Table analysis">
          <div className="ftp-header">
            <TrendingUp size={13} strokeWidth={2.2} />
            <span>Table analysis</span>
            <button className="ftp-close" onClick={() => setTablePanel(null)} aria-label="Close">
              <X size={12} strokeWidth={2.4} />
            </button>
          </div>
          {tablePanel.kind === 'loading' && <div className="ftp-body ftp-loading">Analyzing table…</div>}
          {tablePanel.kind === 'error' && <div className="ftp-body ftp-error">{tablePanel.message}</div>}
          {tablePanel.kind === 'analysis' && <div className="ftp-body">{tablePanel.text}</div>}
          {tablePanel.kind === 'analysis' && (
            <div className="ftp-note">Deterministic analysis — computed on this device.</div>
          )}
        </div>
      )}
    </>
  );
};
