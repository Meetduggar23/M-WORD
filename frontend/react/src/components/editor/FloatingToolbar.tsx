import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, MessageSquarePlus, Sparkles } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import './FloatingToolbar.css';

const FONTS = ['Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Consolas'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

/**
 * Contextual formatting bar shown above the current text selection.
 */
export const FloatingToolbar: React.FC = () => {
  const engine = useDocumentEngine();
  const { toggleRightPanel } = useUI();
  const { activeFormatting: fmt, selection } = engine;
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const visible = !selection.isCollapsed;

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
    const BAR_W = 470;
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

  if (!visible || !pos) return null;

  return (
    <div
      ref={barRef}
      className="floating-toolbar"
      style={{ top: pos.top, left: pos.left }}
      role="toolbar"
      aria-label="Text formatting"
      onMouseDown={(e) => {
        // Keep the text selection alive when clicking buttons, but let
        // selects/inputs behave natively.
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
          toggleRightPanel('comments');
        }}
        title="Comment on selection"
        aria-label="Add comment"
      >
        <MessageSquarePlus size={14} strokeWidth={2.1} />
      </button>
      <button
        className="ft-btn ft-btn-ai"
        onClick={() => toggleRightPanel('ai')}
        title="AI actions for selection"
        aria-label="AI actions"
      >
        <Sparkles size={14} strokeWidth={2.1} />
      </button>
    </div>
  );
};
