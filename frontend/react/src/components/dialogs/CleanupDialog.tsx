import React, { useMemo, useState } from 'react';
import { Brush, X, Eye, CheckCheck, ShieldCheck } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useToast } from '../toast/Toast';
import { planCleanup, applyCleanup, CleanupAction } from '../../features/intel/cleanup';
import './smartDialogs.css';

export const CleanupDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState(false);

  const actions = useMemo(
    () => (engine.document ? planCleanup(engine.document) : []),
    [engine.document],
  );

  // Select all by default once actions are known
  React.useEffect(() => {
    setSelected(new Set(actions.map((a) => a.id)));
  }, [actions]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const apply = () => {
    const chosen = actions.filter((a) => selected.has(a.id));
    const count = applyCleanup(engine, chosen);
    setApplied(true);
    toast(
      count > 0 ? 'success' : 'info',
      count > 0 ? `${count} improvement${count === 1 ? '' : 's'} applied` : 'Nothing changed',
      count > 0 ? 'Undo is available if the result is not what you expected.' : 'The selected fixes had no effect.',
    );
    onClose();
  };

  return (
    <div className="sd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sd-dialog" role="dialog" aria-modal="true" aria-label="Clean up document">
        <header className="sd-header">
          <span className="sd-header-icon"><Brush size={15} strokeWidth={2} /></span>
          <div className="sd-title">
            Clean up document
            <div className="sd-subtitle">{actions.length} improvement{actions.length === 1 ? '' : 's'} found — nothing changes until you apply</div>
          </div>
          <button className="sd-close" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </header>

        <div className="sd-body">
          {actions.length === 0 ? (
            <div className="sd-empty">
              <ShieldCheck size={28} strokeWidth={1.6} />
              <div className="sd-empty-title">Already clean</div>
              <div className="sd-empty-hint">
                No inconsistencies detected — fonts, sizes, spacing, headings and colors are uniform.
              </div>
            </div>
          ) : (
            <>
              <div className="sd-section-label">Preview changes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {actions.map((a: CleanupAction) => (
                  <label key={a.id} className={`sd-check-row${selected.has(a.id) ? ' checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                    />
                    <span className="sd-check-body">
                      <span className="sd-check-title">{a.label}</span>
                      <span className="sd-check-detail">{a.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="sd-note" style={{ marginTop: 12 }}>
                <Eye size={13} strokeWidth={2} />
                Applied as a single undoable step (Ctrl+Z reverts everything).
              </div>
            </>
          )}
        </div>

        <footer className="sd-footer">
          <span className="sd-footer-note">{selected.size} of {actions.length} selected</span>
          <button className="sd-btn" onClick={onClose}>Cancel</button>
          <button className="sd-btn sd-btn-primary" onClick={apply} disabled={!actions.length || applied || !selected.size}>
            <CheckCheck size={13} strokeWidth={2.2} />
            Apply all
          </button>
        </footer>
      </div>
    </div>
  );
};
