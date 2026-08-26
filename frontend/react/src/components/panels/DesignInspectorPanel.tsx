import React, { useMemo, useCallback } from 'react';
import { ScanSearch, X, Check, AlertTriangle, Paintbrush } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import { useToast } from '../toast/Toast';
import {
  inspectParagraph, styleUsage, normalizeStyle, DesignInspection,
} from '../../features/intel/designInspector';
import { Paragraph } from '../../engine/DocumentEngine';
import './DesignInspectorPanel.css';

export const DesignInspectorPanel: React.FC = () => {
  const engine = useDocumentEngine();
  const ui = useUI();
  const { toast } = useToast();

  const currentPara = useMemo(() => {
    if (!engine.document) return null;
    for (const s of engine.document.sections) {
      const block = s.blocks.find((b) => b.id === engine.cursorPosition.blockId);
      if (block && block.type === 'paragraph') return block as Paragraph;
    }
    return null;
  }, [engine.document, engine.cursorPosition.blockId]);

  const inspection: DesignInspection | null = useMemo(
    () => (engine.document && currentPara ? inspectParagraph(engine.document, currentPara) : null),
    [engine.document, currentPara],
  );

  const usage = useMemo(
    () => (engine.document ? styleUsage(engine.document) : []),
    [engine.document],
  );

  const normalize = useCallback((font: string, size: number) => {
    if (!engine.document || !currentPara) return;
    const styleName = currentPara.style ?? 'Normal';
    const changed = engine.transformDocument((doc) => normalizeStyle(doc, styleName, font, size));
    toast(changed ? 'success' : 'info', changed ? 'Normalized' : 'Nothing to normalize',
      changed ? `All "${styleName}" paragraphs now use ${font} ${size}pt.` : undefined);
  }, [engine, currentPara, toast]);

  return (
    <aside className="inspector-panel panel-enter-right" aria-label="Design Inspector">
      <header className="di-header">
        <div className="di-title-row">
          <span className="di-badge"><ScanSearch size={14} strokeWidth={2.2} /></span>
          <div className="di-title">Design Inspector</div>
        </div>
        <button className="di-close" onClick={() => ui.setRightPanel(null)} aria-label="Close inspector" title="Close">
          <X size={15} strokeWidth={2.2} />
        </button>
      </header>

      <div className="di-scroll">
        {!inspection ? (
          <div className="sd-empty">
            <ScanSearch size={26} strokeWidth={1.6} />
            <div className="sd-empty-title">Nothing to inspect</div>
            <div className="sd-empty-hint">Place the cursor in a paragraph to inspect its typography and consistency.</div>
          </div>
        ) : (
          <>
            <div className="di-section-label">Typography</div>
            <div className="di-grid">
              <div className="di-field"><span className="di-k">Font</span><span className="di-v" style={{ fontFamily: inspection.font }}>{inspection.font}</span></div>
              <div className="di-field"><span className="di-k">Size</span><span className="di-v">{inspection.fontSize}pt</span></div>
              <div className="di-field"><span className="di-k">Weight</span><span className="di-v">{inspection.bold ? 'Bold' : 'Regular'}</span></div>
              <div className="di-field"><span className="di-k">Color</span><span className="di-v">{inspection.color}</span></div>
              <div className="di-field"><span className="di-k">Alignment</span><span className="di-v">{inspection.alignment}</span></div>
            </div>

            <div className="di-section-label">Spacing</div>
            <div className="di-grid">
              <div className="di-field"><span className="di-k">Line height</span><span className="di-v">{inspection.lineHeight}</span></div>
              <div className="di-field"><span className="di-k">Before</span><span className="di-v">{inspection.spaceBefore}pt</span></div>
              <div className="di-field"><span className="di-k">After</span><span className="di-v">{inspection.spaceAfter}pt</span></div>
            </div>

            <div className="di-section-label">Style</div>
            <div className="di-style-name">{inspection.styleName}</div>

            <div className="di-section-label">Consistency</div>
            <div className="di-consistency">
              {inspection.consistency.map((c) => (
                <div key={c.label} className="di-cons-row">
                  <span className="di-cons-label">{c.label}</span>
                  <span className="di-cons-value">{c.value}</span>
                  <div className="di-cons-bar">
                    <div
                      className="di-cons-fill"
                      style={{ width: `${c.percent}%`, background: c.percent >= 90 ? '#16a34a' : c.percent >= 60 ? '#d97706' : '#c42b1c' }}
                    />
                  </div>
                  <span className="di-cons-pct">{c.percent}%</span>
                </div>
              ))}
            </div>

            {inspection.consistency
              .filter((c) => c.percent < 100 && c.divergentBlockIds.length > 0)
              .slice(0, 1)
              .map((c) => (
                <div key={c.label} className="di-warn">
                  <AlertTriangle size={13} strokeWidth={2.2} />
                  <span>
                    {c.divergentBlockIds.length} similar paragraph{c.divergentBlockIds.length > 1 ? 's' : ''} differ in {c.label.toLowerCase()} ({c.value}).
                  </span>
                  <button
                    className="di-normalize-btn"
                    onClick={() => normalize(inspection.font, inspection.fontSize)}
                  >
                    <Paintbrush size={11} strokeWidth={2.1} />
                    Normalize
                  </button>
                </div>
              ))}

            <div className="di-section-label">Styles in use</div>
            <div className="di-usage">
              {usage.map((u) => (
                <div key={u.style} className="di-usage-row">
                  <span className="di-usage-style">{u.style}</span>
                  <span className="di-usage-count">{u.count}×</span>
                  <span className={`di-usage-font${u.fontConsistency < 100 ? ' warn' : ''}`}>
                    {u.fontConsistency >= 100 ? <Check size={11} strokeWidth={2.6} /> : `${u.fontConsistency}%`}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="di-footer">
        Cursor-driven — move the caret to inspect another paragraph.
      </footer>
    </aside>
  );
};
