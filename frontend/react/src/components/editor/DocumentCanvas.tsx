import React, { useRef, useEffect, useCallback } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import {
  Paragraph, TextRun, Table, ImageBlock, Block, ShapeBlock, ChartBlock,
  SmartArtBlock, EquationBlock, HorizontalRule, PageBreak, CursorPosition,
} from '../../engine/DocumentEngine';
import { analyzePaste } from '../../features/text/smartPaste';
import './DocumentCanvas.css';

interface DocumentCanvasProps {
  zoom: number;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({ zoom }) => {
  const {
    document: doc, selection, insertText, deleteBackward, deleteForward,
    insertParagraph, toggleBold, toggleItalic, toggleUnderline,
    selectAll, engine,
    decreaseListLevel, insertHyperlink, setFontSize,
    undo, redo, setSelection,
  } = useDocumentEngine();
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (canvasRef.current) canvasRef.current.focus();
  }, []);

  interface CursorNode { textNode: Text | null; element: HTMLElement | null; offset: number; }

  const findCursorNode = useCallback((): CursorNode | null => {
    if (!canvasRef.current) return null;
    const blockId = selection.end.blockId;
    const runIndex = selection.end.runIndex;
    const charOffset = selection.end.offset;
    const blockEl = canvasRef.current.querySelector(`[data-block-id="${blockId}"]`);
    if (!blockEl) return null;
    const runSpans = blockEl.querySelectorAll('.text-run');

    for (let i = 0; i <= runIndex && i < runSpans.length; i++) {
      const span = runSpans[i];
      if (i === runIndex) {
        const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT, null);
        let textNode = walker.nextNode() as Text | null;
        let accumulated = 0;
        while (textNode) {
          const len = textNode.textContent?.length || 0;
          if (accumulated + len >= charOffset) {
            return { textNode, element: blockEl as HTMLElement, offset: charOffset - accumulated };
          }
          accumulated += len;
          textNode = walker.nextNode() as Text | null;
        }
        if (span.lastChild) {
          return { textNode: span.lastChild as Text, element: blockEl as HTMLElement, offset: span.lastChild.textContent?.length || 0 };
        }
        return { textNode: null, element: blockEl as HTMLElement, offset: 0 };
      }
    }
    return { textNode: null, element: blockEl as HTMLElement, offset: 0 };
  }, [selection.end]);

  // Cursor positioning
  const updateCursorPosition = useCallback(() => {
    if (!canvasRef.current) return;
    const oldCursor = canvasRef.current.querySelector('.editor-cursor');
    if (oldCursor) oldCursor.remove();

    // Hide the caret while a range is selected — the native highlight shows instead
    if (!selection.isCollapsed) return;

    const cursorNode = findCursorNode();
    if (!cursorNode) return;

    const cursor = document.createElement('div');
    cursor.className = 'editor-cursor';
    cursor.style.position = 'absolute';

    const range = document.createRange();
    const textNode = cursorNode.textNode;
    const offset = cursorNode.offset;

    if (textNode) {
      range.setStart(textNode, Math.min(offset, textNode.textContent?.length || 0));
      range.collapse(true);
      const rects = range.getClientRects();
      if (rects.length > 0) {
        const rect = rects[0];
        const canvasRect = canvasRef.current.getBoundingClientRect();
        cursor.style.left = `${rect.left - canvasRect.left}px`;
        cursor.style.top = `${rect.top - canvasRect.top}px`;
        cursor.style.height = `${rect.height}px`;
        canvasRef.current.style.cursor = 'none';
        canvasRef.current.appendChild(cursor);
        return;
      }
    }

    const blockEl = cursorNode.element;
    if (blockEl) {
      const rect = blockEl.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      cursor.style.left = `${rect.left - canvasRect.left + 2}px`;
      cursor.style.top = `${rect.top - canvasRect.top}px`;
      cursor.style.height = `${rect.height}px`;
      canvasRef.current.style.cursor = 'none';
      canvasRef.current.appendChild(cursor);
    }
  }, [findCursorNode, selection]);

  useEffect(() => { updateCursorPosition(); }, [updateCursorPosition, selection]);

  // Re-anchor the caret after document mutations that don't move the
  // selection (e.g. formatting or style changes re-render blocks).
  useEffect(() => { updateCursorPosition(); }, [doc, updateCursorPosition]);

  // ─── Mouse selection ───────────────────────────────────────────────────────
  interface HitResult { blockId: string; runIndex: number; offset: number; blockEl: HTMLElement; }

  const hitTest = useCallback((clientX: number, clientY: number): HitResult | null => {
    const docEl = document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    };
    let node: Node | null = null;
    let offset = 0;
    if (docEl.caretRangeFromPoint) {
      const range = docEl.caretRangeFromPoint(clientX, clientY);
      if (range) { node = range.startContainer; offset = range.startOffset; }
    } else if (docEl.caretPositionFromPoint) {
      const p = docEl.caretPositionFromPoint(clientX, clientY);
      if (p) { node = p.offsetNode; offset = p.offset; }
    }
    if (!node) return null;

    // Climb from the text node to its run span, then to the owning block
    let runSpan: HTMLElement | null = null;
    let walker: Node | null = node;
    while (walker) {
      const el: HTMLElement | null = walker.nodeType === Node.ELEMENT_NODE
        ? (walker as HTMLElement)
        : walker.parentElement;
      if (!el) return null;
      if (el.classList.contains('text-run')) { runSpan = el; break; }
      if (el.dataset.blockId && !runSpan) return null; // clicked a non-text block
      walker = el.parentElement;
    }
    if (!runSpan) return null;

    const blockEl = runSpan.closest('[data-block-id]') as HTMLElement | null;
    if (!blockEl || !canvasRef.current?.contains(blockEl)) return null;
    const blockId = blockEl.dataset.blockId!;

    // Char offset inside the run
    let charOffset = 0;
    const spanWalker = document.createTreeWalker(runSpan, NodeFilter.SHOW_TEXT, null);
    let tn = spanWalker.nextNode() as Text | null;
    while (tn) {
      if (tn === node) { charOffset += Math.min(offset, tn.textContent?.length ?? 0); break; }
      charOffset += tn.textContent?.length ?? 0;
      tn = spanWalker.nextNode() as Text | null;
    }

    const runs = Array.from(blockEl.querySelectorAll('.text-run'));
    const runIndex = runs.indexOf(runSpan);
    return { blockId, runIndex: runIndex < 0 ? 0 : runIndex, offset: charOffset, blockEl };
  }, []);

  const toCursor = useCallback((hit: HitResult | null): CursorPosition | null => {
    if (!hit) return null;
    return { blockId: hit.blockId, runIndex: hit.runIndex, offset: hit.offset };
  }, []);

  /** Order two positions by their DOM order so start always precedes end. */
  const orderPositions = useCallback(
    (a: CursorPosition & { el?: HTMLElement }, b: CursorPosition & { el?: HTMLElement }): [CursorPosition, CursorPosition] => {
      if (a.blockId === b.blockId) {
        const cmp = a.runIndex - b.runIndex || a.offset - b.offset;
        return cmp <= 0 ? [a, b] : [b, a];
      }
      const elA = a.el ?? document.querySelector(`[data-block-id="${a.blockId}"]`);
      const elB = b.el ?? document.querySelector(`[data-block-id="${b.blockId}"]`);
      if (elA && elB && (elB.compareDocumentPosition(elA) & Node.DOCUMENT_POSITION_PRECEDING)) {
        return [b, a];
      }
      return [a, b];
    },
    [],
  );

  useEffect(() => {
    const handleMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;

      const nativeSel = window.getSelection();
      if (nativeSel && !nativeSel.isCollapsed && nativeSel.rangeCount > 0) {
        const range = nativeSel.getRangeAt(0);
        const startPos = mapBoundary(range.startContainer, range.startOffset);
        const endPos = mapBoundary(range.endContainer, range.endOffset);
        if (startPos && endPos) {
          const [s, e] = orderPositions(startPos, endPos);
          setSelection(s, e);
        }
      }
    };

    const mapBoundary = (container: Node, offset: number): (CursorPosition & { el?: HTMLElement }) | null => {
      let runSpan: HTMLElement | null = null;
      const el = container instanceof HTMLElement ? container : container.parentElement;
      if (!el) return null;
      runSpan = el.classList.contains('text-run') ? el : el.closest('.text-run');
      if (!runSpan) return null;
      const blockEl = runSpan.closest('[data-block-id]') as HTMLElement | null;
      if (!blockEl) return null;
      const blockId = blockEl.dataset.blockId!;
      let charOffset = 0;
      const tw = document.createTreeWalker(runSpan, NodeFilter.SHOW_TEXT, null);
      let tn = tw.nextNode() as Text | null;
      while (tn) {
        if (tn === container) { charOffset += Math.min(offset, tn.textContent?.length ?? 0); break; }
        charOffset += tn.textContent?.length ?? 0;
        tn = tw.nextNode() as Text | null;
      }
      const runs = Array.from(blockEl.querySelectorAll('.text-run'));
      const runIndex = runs.indexOf(runSpan);
      return { blockId, runIndex: runIndex < 0 ? 0 : runIndex, offset: charOffset, el: blockEl };
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [hitTest, setSelection, orderPositions]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only left button on text areas
    if (e.button !== 0) return;
    draggingRef.current = true;
    canvasRef.current?.focus();
    const hit = hitTest(e.clientX, e.clientY);
    const pos = toCursor(hit);
    if (pos) setSelection(pos, pos);
  }, [hitTest, toCursor, setSelection]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) return;

    // Find the word around the click point within this run
    const runText = hit.blockEl.querySelectorAll('.text-run')[hit.runIndex]?.textContent ?? '';
    const globalOffset = (() => {
      const runs = Array.from(hit.blockEl.querySelectorAll('.text-run'));
      let acc = 0;
      for (let i = 0; i < hit.runIndex; i++) acc += runs[i]?.textContent?.length ?? 0;
      return acc + hit.offset;
    })();

    const isWordChar = (ch: string) => /[\w'’-]/.test(ch);
    let start = globalOffset;
    let end = globalOffset;
    while (start > 0 && isWordChar(runText[start - 1] ?? '')) start--;
    while (end < runText.length && isWordChar(runText[end] ?? '')) end++;
    if (start === end) return;

    // Map back to per-run cursor positions
    const runs = Array.from(hit.blockEl.querySelectorAll('.text-run'));
    let acc = 0;
    let startPos: CursorPosition | null = null;
    let endPos: CursorPosition | null = null;
    for (let i = 0; i < runs.length; i++) {
      const len = runs[i].textContent?.length ?? 0;
      if (!startPos && start < acc + len) startPos = { blockId: hit.blockId, runIndex: i, offset: start - acc };
      if (!endPos && end <= acc + len) endPos = { blockId: hit.blockId, runIndex: i, offset: end - acc };
      acc += len;
    }
    if (startPos && endPos) {
      setSelection(startPos, endPos);
      e.preventDefault();
    }
  }, [hitTest, setSelection]);


  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl) {
      switch (e.key.toLowerCase()) {
        // Note: document-level shortcuts (Ctrl+N/O/S/P/F/H…) are handled
        // globally by the app shell — do not intercept them here.
        case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); return;
        case 'y': e.preventDefault(); redo(); return;
        case 'b': e.preventDefault(); toggleBold(); return;
        case 'i': e.preventDefault(); toggleItalic(); return;
        case 'u': e.preventDefault(); toggleUnderline(); return;
        case 'a': e.preventDefault(); selectAll(); return;
        case 'k': e.preventDefault(); {
          const url = prompt('URL:', 'https://');
          if (url) insertHyperlink(url);
          return;
        }
        case ']': e.preventDefault(); setFontSize(Math.min(72, (engine.getActiveFormatting().fontSize || 11) + 2)); return;
        case '[': e.preventDefault(); setFontSize(Math.max(8, (engine.getActiveFormatting().fontSize || 11) - 2)); return;
        default: return;
      }
    }

    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); e.shiftKey ? engine.extendSelectionLeft() : engine.moveCursorLeft(); return;
      case 'ArrowRight': e.preventDefault(); e.shiftKey ? engine.extendSelectionRight() : engine.moveCursorRight(); return;
      case 'ArrowUp': e.preventDefault(); e.shiftKey ? engine.extendSelectionUp() : engine.moveCursorUp(); return;
      case 'ArrowDown': e.preventDefault(); e.shiftKey ? engine.extendSelectionDown() : engine.moveCursorDown(); return;
      case 'Home': e.preventDefault(); e.shiftKey ? engine.extendSelectionToStart() : engine.moveCursorToStart(); return;
      case 'End': e.preventDefault(); e.shiftKey ? engine.extendSelectionToEnd() : engine.moveCursorToEnd(); return;
      case 'Backspace': e.preventDefault(); deleteBackward(); return;
      case 'Delete': e.preventDefault(); deleteForward(); return;
      case 'Enter': e.preventDefault(); insertParagraph(); return;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) decreaseListLevel();
        else insertText('\t');
        return;
      default: break;
    }

    if (e.key.length === 1 && !isCtrl && !e.altKey) {
      e.preventDefault();
      insertText(e.key);
    }
  }, [insertText, deleteBackward, deleteForward, insertParagraph, toggleBold, toggleItalic,
      toggleUnderline, undo, redo, selectAll, engine,
      setFontSize, insertHyperlink, decreaseListLevel]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html') || undefined;
    if (!text && !html) return;

    // Smart paste: offer conversion options for foreign/rich content
    try {
      const candidate = analyzePaste(text, html);
      if (candidate.looksForeign || candidate.looksLikeTable || candidate.looksLikeKeyValue) {
        window.dispatchEvent(new CustomEvent('word:smart-paste', { detail: candidate }));
        return;
      }
    } catch {
      /* fall through to plain insert */
    }

    if (text) insertText(text);
  }, [insertText]);

  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    if (selection.isCollapsed) return;
    e.clipboardData.setData('text/plain', engine.getSelectedText());
  }, [selection, engine]);

  const handleCut = useCallback((e: React.ClipboardEvent) => {
    if (selection.isCollapsed) return;
    e.clipboardData.setData('text/plain', engine.getSelectedText());
    deleteBackward();
  }, [selection, engine, deleteBackward]);

  if (!doc) return null;

  return (
    <div className="document-canvas-wrapper">
      {/* Watermark */}
      {doc.watermarks.length > 0 && doc.watermarks[0].type === 'text' && (
        <div className="document-watermark" style={{
          transform: `rotate(${doc.watermarks[0].rotation || -45}deg)`,
          color: doc.watermarks[0].color || '#C0C0C0',
          fontSize: `${(doc.watermarks[0].fontSize || 48) * zoom / 100}px`,
          fontFamily: doc.watermarks[0].font || 'Calibri',
          opacity: (doc.watermarks[0].transparency || 150) / 255,
        }}>
          {doc.watermarks[0].text}
        </div>
      )}

      <div
        ref={canvasRef}
        className="document-canvas"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCopy={handleCopy}
        onCut={handleCut}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="canvas-workspace">
          {doc.sections.map((section) => (
            <div key={section.id} className="document-section">
              {/* Header */}
              {doc.headers.length > 0 && doc.headers[0].paragraphs.length > 0 && (
                <div className="section-header">
                  {doc.headers[0].paragraphs.map(p => (
                    <div key={p.id} className="header-text" data-block-id={p.id}>
                      {p.textRuns.map(r => (
                        <span key={r.id} className="text-run" style={{
                          fontSize: r.formatting.fontSize ? `${r.formatting.fontSize}px` : '9px',
                          color: r.formatting.color || '#808080',
                        }}>{r.text}</span>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="section-page">
                <div className="page-content">
                  {section.blocks.map((block) => (
                    <BlockRenderer key={block.id} block={block} />
                  ))}
                </div>
                <div className="page-border" />
              </div>

              {/* Footer */}
              {doc.footers.length > 0 && doc.footers[0].paragraphs.length > 0 && (
                <div className="section-footer">
                  {doc.footers[0].paragraphs.map(p => (
                    <div key={p.id} className="footer-text" data-block-id={p.id}>
                      {p.textRuns.map(r => (
                        <span key={r.id} className="text-run" style={{
                          fontSize: r.formatting.fontSize ? `${r.formatting.fontSize}px` : '9px',
                          color: r.formatting.color || '#808080',
                        }}>{r.text}</span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footnotes */}
      {doc.footnotes.length > 0 && (
        <div className="footnotes-section">
          <div className="footnotes-divider" />
          {doc.footnotes.map(fn => (
            <div key={fn.id} className="footnote-item">
              <span className="footnote-marker">{fn.marker}</span>
              <span className="footnote-text">{fn.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Endnotes */}
      {doc.endnotes.length > 0 && (
        <div className="endnotes-section">
          <div className="footnotes-divider" />
          {doc.endnotes.map(en => (
            <div key={en.id} className="footnote-item">
              <span className="footnote-marker">{en.marker}</span>
              <span className="footnote-text">{en.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Block Renderer ──────────────────────────────────────────────────────────
const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.type) {
    case 'paragraph': return <ParagraphRenderer paragraph={block} />;
    case 'table': return <TableRenderer table={block} />;
    case 'image': return <ImageRenderer image={block} />;
    case 'shape': return <ShapeRenderer shape={block} />;
    case 'chart': return <ChartRenderer chart={block} />;
    case 'smartart': return <SmartArtRenderer smartart={block} />;
    case 'equation': return <EquationRenderer equation={block} />;
    case 'horizontalRule': return <HorizontalRuleRenderer rule={block} />;
    case 'pageBreak': return <PageBreakRenderer pageBreak={block} />;
    default: return null;
  }
};

// ─── Paragraph Renderer ──────────────────────────────────────────────────────
const ParagraphRenderer: React.FC<{ paragraph: Paragraph }> = ({ paragraph }) => {
  const { selection, engine } = useDocumentEngine();
  const isInSelection = !selection.isCollapsed && (
    selection.start.blockId === paragraph.id || selection.end.blockId === paragraph.id
  );

  const fmt = paragraph.formatting;
  const styleClass = paragraph.style !== 'Normal' ? `para-${paragraph.style}` : '';
  const alignClass = `align-${fmt.alignment}`;

  // List prefix
  let listPrefix = '';
  if (fmt.listFormat.type === 'bullet') {
    listPrefix = engine.getBulletCharacter(fmt.listFormat.level);
  } else if (fmt.listFormat.type === 'numbered') {
    listPrefix = engine.getNumberCharacter(fmt.listFormat.level, 0);
  }

  // Drop cap
  const firstRunText = paragraph.textRuns[0]?.text || '';
  const hasDropCap = fmt.dropCap.style !== 'none' && firstRunText.length > 0;

  // Borders
  const borderStyle: React.CSSProperties = {};
  if (fmt.paragraphBorders.top) borderStyle.borderTop = `${fmt.paragraphBorders.top.size}px ${fmt.paragraphBorders.top.style} ${fmt.paragraphBorders.top.color}`;
  if (fmt.paragraphBorders.bottom) borderStyle.borderBottom = `${fmt.paragraphBorders.bottom.size}px ${fmt.paragraphBorders.bottom.style} ${fmt.paragraphBorders.bottom.color}`;
  if (fmt.paragraphBorders.left) borderStyle.borderLeft = `${fmt.paragraphBorders.left.size}px ${fmt.paragraphBorders.left.style} ${fmt.paragraphBorders.left.color}`;
  if (fmt.paragraphBorders.right) borderStyle.borderRight = `${fmt.paragraphBorders.right.size}px ${fmt.paragraphBorders.right.style} ${fmt.paragraphBorders.right.color}`;

  // Shading
  if (fmt.paragraphShading.fill !== 'auto' && fmt.paragraphShading.pattern !== 'clear') {
    borderStyle.backgroundColor = fmt.paragraphShading.fill;
  }

  return (
    <div
      className={`paragraph-block ${styleClass} ${alignClass} ${isInSelection ? 'in-selection' : ''}`}
      data-block-id={paragraph.id}
      style={{
        lineHeight: fmt.lineSpacing,
        marginTop: fmt.spaceBefore,
        marginBottom: fmt.spaceAfter,
        paddingLeft: fmt.leftIndent + (listPrefix ? 240 : 0),
        paddingRight: fmt.rightIndent,
        textIndent: fmt.firstLineIndent,
        pageBreakBefore: fmt.pageBreakBefore ? 'always' : undefined,
        ...borderStyle,
      }}
    >
      {/* List prefix */}
      {listPrefix && (
        <span className="list-prefix" style={{ marginLeft: -(240 + fmt.leftIndent), paddingRight: 120 }}>
          {listPrefix}
        </span>
      )}

      {/* Drop cap */}
      {hasDropCap && paragraph.textRuns.length > 0 && (
        <span className="drop-cap" style={{
          float: 'left',
          fontSize: `${(fmt.dropCap.lines || 3) * 24}px`,
          lineHeight: '0.8',
          fontWeight: 'bold',
          marginRight: '4px',
          marginTop: '4px',
        }}>
          {firstRunText[0]}
        </span>
      )}

      {paragraph.textRuns.map((run, idx) => {
        // Skip first char if drop cap
        const text = hasDropCap && idx === 0 ? firstRunText.substring(1) : run.text;
        if (!text && !hasDropCap) return null;
        return <TextRunRenderer key={run.id} run={{ ...run, text }} />;
      })}
      {paragraph.textRuns.length === 0 && <span className="text-run">&nbsp;</span>}
    </div>
  );
};

// ─── Text Run Renderer ───────────────────────────────────────────────────────
const TextRunRenderer: React.FC<{ run: TextRun }> = ({ run }) => {
  const fmt = run.formatting;
  const style: React.CSSProperties = {};

  if (fmt.bold) style.fontWeight = 'bold';
  if (fmt.italic) style.fontStyle = 'italic';
  if (fmt.underline) style.textDecoration = 'underline';
  if (fmt.strikethrough) style.textDecoration = style.textDecoration ? `${style.textDecoration} line-through` : 'line-through';
  if (fmt.doubleStrikethrough) style.textDecoration = style.textDecoration ? `${style.textDecoration} line-through` : 'line-through';
  if (fmt.fontFamily) style.fontFamily = fmt.fontFamily;
  if (fmt.fontSize) style.fontSize = `${fmt.fontSize}px`;
  if (fmt.color) style.color = fmt.color;
  if (fmt.highlight) style.backgroundColor = fmt.highlight;
  if (fmt.superscript) { style.verticalAlign = 'super'; style.fontSize = '0.8em'; }
  if (fmt.subscript) { style.verticalAlign = 'sub'; style.fontSize = '0.8em'; }
  if (fmt.smallCaps) style.fontVariant = 'small-caps';
  if (fmt.allCaps) style.textTransform = 'uppercase';
  if (fmt.shadow) style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
  if (fmt.outline) style.WebkitTextStroke = '1px currentColor';
  if (fmt.characterSpacing) style.letterSpacing = `${fmt.characterSpacing / 20}px`;

  const content = <span className="text-run" style={style}>{run.text}</span>;

  if (run.hyperlink) {
    return (
      <a
        href={run.hyperlink.url}
        className="text-run hyperlink"
        style={{ color: run.hyperlink.color || '#0563C1', textDecoration: 'underline', cursor: 'pointer' }}
        title={run.hyperlink.tooltip || run.hyperlink.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {run.text}
      </a>
    );
  }

  if (run.footnoteId || run.endnoteId) {
    return (
      <>
        {content}
        <sup className="footnote-ref">
          {run.footnoteId ? '¹' : '†'}
        </sup>
      </>
    );
  }

  if (run.commentIds && run.commentIds.length > 0) {
    return (
      <span className="text-run comment-highlight" style={{ backgroundColor: 'rgba(255, 255, 0, 0.3)' }}>
        {run.text}
      </span>
    );
  }

  return content;
};

// ─── Table Renderer ──────────────────────────────────────────────────────────
const TableRenderer: React.FC<{ table: Table }> = ({ table }) => (
  <div className="table-block" data-block-id={table.id}>
    <table>
      <colgroup>
        {table.columnWidths.map((w, i) => <col key={i} style={{ width: `${w / 96}%` }} />)}
      </colgroup>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row.id}>
            {row.cells.map((cell) => (
              <td
                key={cell.id}
                rowSpan={cell.rowSpan}
                colSpan={cell.colSpan}
                style={{
                  backgroundColor: cell.backgroundColor,
                  verticalAlign: cell.verticalAlignment,
                  width: cell.width ? `${cell.width / 96}%` : undefined,
                }}
              >
                {cell.textRuns.map((run) => (
                  <span key={run.id} className="text-run">{run.text}</span>
                ))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Image Renderer ──────────────────────────────────────────────────────────
const ImageRenderer: React.FC<{ image: ImageBlock }> = ({ image }) => (
  <div className={`image-block image-${image.alignment}`} data-block-id={image.id}>
    <img
      src={image.src}
      alt={image.altText}
      style={{
        width: image.width, height: image.height,
        transform: image.rotation ? `rotate(${image.rotation}deg)` : undefined,
      }}
      draggable={false}
    />
    {image.description && <div className="image-caption">{image.description}</div>}
  </div>
);

// ─── Shape Renderer ──────────────────────────────────────────────────────────
const ShapeRenderer: React.FC<{ shape: ShapeBlock }> = ({ shape }) => {
  const getShapeSVG = () => {
    const w = shape.width;
    const h = shape.height;
    const fill = shape.fill.color || '#4472C4';
    const stroke = shape.outline.color || '#333';

    switch (shape.shapeType) {
      case 'rectangle':
      case 'roundedRectangle':
        return <rect x="2" y="2" width={w - 4} height={h - 4} rx={shape.shapeType === 'roundedRectangle' ? 10 : 0} fill={fill} stroke={stroke} strokeWidth="2" />;
      case 'oval':
      case 'circle':
        return <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 2} ry={h / 2 - 2} fill={fill} stroke={stroke} strokeWidth="2" />;
      case 'triangle':
        return <polygon points={`${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}`} fill={fill} stroke={stroke} strokeWidth="2" />;
      case 'diamond':
        return <polygon points={`${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}`} fill={fill} stroke={stroke} strokeWidth="2" />;
      case 'star5': {
        const cx = w / 2, cy = h / 2, outerR = Math.min(w, h) / 2 - 2, innerR = outerR * 0.4;
        const pts = Array.from({ length: 10 }, (_, i) => {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2" />;
      }
      case 'heart':
        return <path d={`M ${w / 2} ${h - 4} C ${-w * 0.1} ${h * 0.5} ${w * 0.1} ${-h * 0.1} ${w / 2} ${h * 0.3} C ${w * 0.9} ${-h * 0.1} ${w * 1.1} ${h * 0.5} ${w / 2} ${h - 4} Z`} fill={fill} stroke={stroke} strokeWidth="2" />;
      case 'arrow':
        return <polygon points={`2,${h / 3} ${w * 0.6},${h / 3} ${w * 0.6},2 ${w - 2},${h / 2} ${w * 0.6},${h - 2} ${w * 0.6},${h * 2 / 3} 2,${h * 2 / 3}`} fill={fill} stroke={stroke} strokeWidth="2" />;
      default:
        return <rect x="2" y="2" width={w - 4} height={h - 4} fill={fill} stroke={stroke} strokeWidth="2" />;
    }
  };

  return (
    <div className="shape-block" data-block-id={shape.id} style={{
      position: 'relative',
      width: shape.width,
      height: shape.height,
      transform: `rotate(${shape.rotation}deg)${shape.flipH ? ' scaleX(-1)' : ''}${shape.flipV ? ' scaleY(-1)' : ''}`,
      margin: '8px auto',
    }}>
      <svg width={shape.width} height={shape.height} viewBox={`0 0 ${shape.width} ${shape.height}`}>
        {getShapeSVG()}
      </svg>
      {shape.textRuns && shape.textRuns.length > 0 && (
        <div className="shape-text" style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: shape.textFormatting.verticalAlignment === 'top' ? 'flex-start' : shape.textFormatting.verticalAlignment === 'bottom' ? 'flex-end' : 'center',
          justifyContent: shape.textFormatting.alignment === 'center' ? 'center' : shape.textFormatting.alignment === 'right' ? 'flex-end' : 'flex-start',
          padding: `${shape.textFormatting.margins.top}px ${shape.textFormatting.margins.right}px`,
        }}>
          {shape.textRuns.map(r => <span key={r.id} className="text-run">{r.text}</span>)}
        </div>
      )}
      {shape.text && !shape.textRuns && (
        <div className="shape-text" style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '14px', fontWeight: 'bold',
        }}>
          {shape.text}
        </div>
      )}
    </div>
  );
};

// ─── Chart Renderer ──────────────────────────────────────────────────────────
const ChartRenderer: React.FC<{ chart: ChartBlock }> = ({ chart }) => {
  const maxVal = Math.max(...chart.data.series.flatMap(s => s.values), 1);
  const barWidth = Math.max(8, (chart.width - 80) / (chart.data.labels.length * chart.data.series.length + chart.data.labels.length));

  return (
    <div className="chart-block" data-block-id={chart.id} style={{ textAlign: chart.alignment, margin: '12px 0' }}>
      {chart.title.text && chart.title.position !== 'none' && (
        <div className="chart-title" style={{ fontWeight: chart.title.formatting.bold ? 'bold' : 'normal', fontSize: chart.title.formatting.fontSize || 14 }}>
          {chart.title.text}
        </div>
      )}
      <div className="chart-area" style={{ width: chart.width, height: chart.height, margin: '0 auto', position: 'relative', border: '1px solid #ddd', padding: '8px', background: 'white' }}>
        {/* Simple bar chart visualization */}
        <svg width={chart.width - 16} height={chart.height - 16}>
          {/* Y axis */}
          <line x1="40" y1="0" x2="40" y2={chart.height - 40} stroke="#ccc" strokeWidth="1" />
          {/* X axis */}
          <line x1="40" y1={chart.height - 40} x2={chart.width - 16} y2={chart.height - 40} stroke="#ccc" strokeWidth="1" />

          {chart.data.labels.map((_label, li) => {
            const groupX = 50 + li * ((chart.width - 66) / chart.data.labels.length);
            return chart.data.series.map((series, si) => {
              const x = groupX + si * (barWidth + 2);
              const barH = (series.values[li] / maxVal) * (chart.height - 60);
              const y = chart.height - 40 - barH;
              return (
                <g key={`${li}-${si}`}>
                  <rect x={x} y={y} width={barWidth} height={barH} fill={series.color || chart.style.colorScheme[si % chart.style.colorScheme.length]} rx="1" />
                </g>
              );
            });
          })}

          {/* Labels */}
          {chart.data.labels.map((_label, li) => {
            const x = 50 + li * ((chart.width - 66) / chart.data.labels.length) + (chart.data.series.length * (barWidth + 2)) / 2;
            return (
              <text key={li} x={x} y={chart.height - 20} textAnchor="middle" fontSize="10" fill="#666">
                {_label}
              </text>
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      {(chart.legend.position as string) !== 'none' && (
        <div className="chart-legend" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
          {chart.data.series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <div style={{ width: 12, height: 12, background: s.color || chart.style.colorScheme[i], borderRadius: 2 }} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── SmartArt Renderer ───────────────────────────────────────────────────────
const SmartArtRenderer: React.FC<{ smartart: SmartArtBlock }> = ({ smartart }) => (
  <div className="smartart-block" data-block-id={smartart.id} style={{ textAlign: smartart.alignment, margin: '12px 0' }}>
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
      {smartart.nodes.map((node) => (
        <div key={node.id} style={{
          padding: '12px 20px', background: '#4472C4', color: 'white', borderRadius: '4px',
          fontSize: '13px', minWidth: '100px', textAlign: 'center',
        }}>
          {node.text}
          {node.children.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', justifyContent: 'center' }}>
              {node.children.map(child => (
                <div key={child.id} style={{
                  padding: '6px 12px', background: '#5B9BD5', borderRadius: '3px', fontSize: '11px',
                }}>
                  {child.text}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// ─── Equation Renderer ───────────────────────────────────────────────────────
const EquationRenderer: React.FC<{ equation: EquationBlock }> = ({ equation }) => (
  <div className="equation-block" data-block-id={equation.id} style={{
    textAlign: equation.justification, margin: '12px 0',
    fontFamily: 'Cambria Math, serif', fontSize: '18px', fontStyle: 'italic',
  }}>
    {equation.textRuns.map(r => (
      <span key={r.id} className="text-run" style={{ fontStyle: 'italic' }}>{r.text}</span>
    ))}
    {equation.textRuns.length === 0 && <span>{equation.latex}</span>}
  </div>
);

// ─── Horizontal Rule Renderer ────────────────────────────────────────────────
const HorizontalRuleRenderer: React.FC<{ rule: HorizontalRule }> = ({ rule }) => (
  <div className="horizontal-rule-block" data-block-id={rule.id} style={{ margin: '8px 0', textAlign: 'center' }}>
    <hr style={{
      border: 'none',
      borderTop: `${rule.style === 'double' ? '3px double' : rule.style === 'thick' ? '3px solid' : rule.style === 'dashed' ? '1px dashed' : rule.style === 'dotted' ? '1px dotted' : '1px solid'} ${rule.color}`,
      width: `${rule.width}%`,
      margin: '0 auto',
    }} />
  </div>
);

// ─── Page Break Renderer ─────────────────────────────────────────────────────
const PageBreakRenderer: React.FC<{ pageBreak: PageBreak }> = ({ pageBreak }) => (
  <div className="page-break-block" data-block-id={pageBreak.id} style={{
    borderTop: '2px dashed #ccc',
    margin: '16px 0',
    padding: '4px 0',
    textAlign: 'center',
    fontSize: '10px',
    color: '#999',
  }}>
    ── {pageBreak.breakType === 'page' ? 'Page Break' : pageBreak.breakType === 'column' ? 'Column Break' : 'Section Break'} ──
  </div>
);
