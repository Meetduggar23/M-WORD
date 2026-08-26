/* eslint-disable react-refresh/only-export-components -- hooks co-located with their UI */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../toast/Toast';
import {
  Command, useCommands, scoreCommand, interpretIntent,
} from '../../features/commands/registry';
import { aiService } from '../../features/ai/aiService';
import { parseMarkdown } from '../../features/text/markdown';
import { renumberReferences, nextNumberFor } from '../../features/intel/smartRefs';
import { addSnapshot } from '../../features/history/snapshots';
import './CommandPalette.css';

interface PaletteCommand extends Command {
  score: number;
}

/* ─── Shared actions used by the palette AND voice commands ───────────────── */

export function useSharedActions() {
  const engine = useDocumentEngine();
  const ui = useUI();
  const { toast } = useToast();

  const openAskAI = useCallback((question: string) => {
    ui.setRightPanel('ai');
    window.dispatchEvent(new CustomEvent('word:ask-ai', { detail: question }));
  }, [ui]);

  const runInlineAI = useCallback((instruction: string) => {
    if (!engine.getSelectedText().trim()) {
      toast('info', 'Select text first', 'Select the text you want the AI to work on, then run the action.');
      return;
    }
    ui.setRightPanel('ai');
    window.dispatchEvent(new CustomEvent('word:inline-ai', { detail: instruction }));
  }, [ui, engine, toast]);

  const insertMarkdown = useCallback((md: string) => {
    const blocks = parseMarkdown(md);
    for (const b of blocks) {
      switch (b.kind) {
        case 'heading':
          engine.insertText(b.text);
          engine.applyStyle(`Heading${Math.min(3, b.level ?? 1)}`);
          engine.insertParagraph();
          break;
        case 'bullet':
          engine.insertText(b.text);
          engine.setBulletList();
          engine.insertParagraph();
          break;
        case 'numbered':
          engine.insertText(b.text);
          engine.setNumberedList();
          engine.insertParagraph();
          break;
        case 'code': {
          engine.insertText(b.text);
          engine.setFontFamily('Consolas');
          engine.insertParagraph();
          break;
        }
        case 'table':
          if (b.rows?.length) engine.insertTableWithData(b.rows);
          break;
        case 'quote':
          engine.insertText(b.text);
          engine.applyStyle('Quote');
          engine.insertParagraph();
          break;
        case 'hr':
          engine.insertHorizontalRule();
          break;
        default:
          engine.insertText(b.text);
          engine.insertParagraph();
      }
    }
  }, [engine]);

  const insertSmartRef = useCallback((kind: 'figure' | 'table') => {
    if (!engine.document) return;
    const n = nextNumberFor(engine.document, kind);
    engine.insertText(`${kind === 'figure' ? 'Figure' : 'Table'} ${n}`);
    toast('info', `${kind === 'figure' ? 'Figure' : 'Table'} ${n} inserted`, 'Run "Update all references" after adding captions to renumber everything.');
  }, [engine, toast]);

  const updateSmartRefs = useCallback(() => {
    if (!engine.document) return;
    const changed = engine.transformDocument((doc) => {
      const r = renumberReferences(doc);
      return r.refsUpdated > 0;
    });
    if (changed) toast('success', 'References updated', 'Captions and in-text references were renumbered.');
    else toast('info', 'Nothing to update', 'No stale references found.');
  }, [engine, toast]);

  const takeSnapshot = useCallback(() => {
    if (!engine.document) return;
    addSnapshot(engine.document.id, {
      title: engine.document.metadata.title || 'Untitled Document',
      data: engine.exportJSON(),
      words: engine.getWordCount(),
      label: 'Manual snapshot',
    });
    toast('success', 'Snapshot saved', 'Open the Document timeline to restore or compare.');
  }, [engine, toast]);

  const openDiff = useCallback(() => {
    ui.openDialog('diff');
  }, [ui]);

  return { openAskAI, runInlineAI, insertMarkdown, insertSmartRef, updateSmartRefs, takeSnapshot, openDiff };
}

/* ─── The palette ─────────────────────────────────────────────────────────── */

export const CommandPalette: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const shared = useSharedActions();

  const commands = useCommands({
    toast: (k, t, d) => toast(k, t, d),
    setTheme,
    theme,
    openAskAI: shared.openAskAI,
    runInlineAI: shared.runInlineAI,
    insertMarkdown: shared.insertMarkdown,
    insertSmartRef: shared.insertSmartRef,
    updateSmartRefs: shared.updateSmartRefs,
    takeSnapshot: shared.takeSnapshot,
    openDiff: shared.openDiff,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo<PaletteCommand[]>(() => {
    if (!query.trim()) {
      return commands.slice(0, 12).map((c) => ({ ...c, score: 0 }));
    }
    return commands
      .map((c) => ({ ...c, score: scoreCommand(query, c) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [query, commands]);

  const intent = useMemo(() => (query.trim() ? interpretIntent(query) : null), [query]);

  /** Smart natural-language rows beneath direct command matches */
  const smartRows = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const rows: { key: string; label: string; hint: string; run: () => void }[] = [];

    if (filtered.length === 0 || intent?.kind === 'ask') {
      rows.push({
        key: 'ask',
        label: `Ask this document: “${q}”`,
        hint: 'Answered from your content with sources',
        run: () => {
          shared.openAskAI(q);
          onClose();
        },
      });
    }
    if (intent?.kind === 'ai') {
      rows.push({
        key: 'ai-edit',
        label: `AI action: ${q}`,
        hint: aiService.isConfigured
          ? `Runs with ${aiService.privacy === 'device' ? 'on-device tools' : 'your configured provider'}`
          : 'Configure an AI provider in Settings first',
        run: () => {
          shared.runInlineAI(q);
          onClose();
        },
      });
    }
    return rows;
  }, [query, filtered.length, intent, shared, onClose]);

  const totalRows = filtered.length + smartRows.length;

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const runAt = useCallback(
    (index: number) => {
      if (index < filtered.length) {
        filtered[index].action();
        onClose();
      } else {
        smartRows[index - filtered.length]?.run();
      }
    },
    [filtered, smartRows, onClose],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(totalRows - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runAt(selected);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  let lastIndex = '';

  return (
    <div className="palette-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKeyDown}>
        <div className="palette-input-row">
          <Search size={15} strokeWidth={2} className="palette-search-icon" />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search commands or ask what you want…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="palette-kbd">Esc</kbd>
        </div>

        <div className="palette-list" ref={listRef} role="listbox" aria-label="Commands">
          {filtered.length === 0 && smartRows.length === 0 && (
            <div className="palette-empty">No matching commands.</div>
          )}

          {filtered.map((cmd, i) => {
            const showSection = cmd.section !== lastIndex;
            lastIndex = cmd.section;
            return (
              <React.Fragment key={cmd.id}>
                {showSection && <div className="palette-section">{cmd.section}</div>}
                <button
                  className={`palette-row${selected === i ? ' selected' : ''}`}
                  data-selected={selected === i}
                  role="option"
                  aria-selected={selected === i}
                  onClick={() => runAt(i)}
                  onMouseEnter={() => setSelected(i)}
                  type="button"
                >
                  <span className="palette-row-icon">{cmd.icon}</span>
                  <span className="palette-row-title">{cmd.title}</span>
                  {cmd.shortcut && <kbd className="palette-kbd">{cmd.shortcut}</kbd>}
                  {selected === i && <CornerDownLeft size={12} strokeWidth={2.2} className="palette-enter" />}
                </button>
              </React.Fragment>
            );
          })}

          {smartRows.map((row, j) => {
            const i = filtered.length + j;
            return (
              <button
                key={row.key}
                className={`palette-row palette-row-smart${selected === i ? ' selected' : ''}`}
                data-selected={selected === i}
                role="option"
                aria-selected={selected === i}
                onClick={() => runAt(i)}
                onMouseEnter={() => setSelected(i)}
                type="button"
              >
                <span className="palette-row-icon"><Sparkles size={14} strokeWidth={2} /></span>
                <span className="palette-row-title">{row.label}</span>
                <span className="palette-row-hint">{row.hint}</span>
              </button>
            );
          })}
        </div>

        <footer className="palette-footer">
          <span className="palette-footer-keys"><ArrowUp size={11} strokeWidth={2} /><ArrowDown size={11} strokeWidth={2} /> navigate</span>
          <span className="palette-footer-keys"><CornerDownLeft size={11} strokeWidth={2} /> run</span>
          <span className="palette-footer-hint">Natural language works — try “make this professional”</span>
        </footer>
      </div>
    </div>
  );
};
