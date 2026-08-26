import React, { useMemo } from 'react';
import { FlaskConical, X, Check, AlertTriangle, CircleAlert, RotateCcw } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { runDocumentTest, TestStatus } from '../../features/intel/docTest';
import './smartDialogs.css';

const STATUS_META: Record<TestStatus, { icon: React.ReactNode; label: string; cls: string }> = {
  pass: { icon: <Check size={13} strokeWidth={2.6} />, label: 'Passed', cls: 'pass' },
  warning: { icon: <AlertTriangle size={13} strokeWidth={2.2} />, label: 'Warning', cls: 'warn' },
  error: { icon: <CircleAlert size={13} strokeWidth={2.2} />, label: 'Error', cls: 'error' },
};

export const DocumentTestDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const report = useMemo(
    () => (engine.document ? runDocumentTest(engine.document) : null),
    [engine.document],
  );

  if (!report) return null;

  const goTo = (blockId?: string) => {
    if (!blockId) return;
    requestAnimationFrame(() => {
      document.querySelector(`[data-block-id="${blockId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  return (
    <div className="sd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sd-dialog" role="dialog" aria-modal="true" aria-label="Document test">
        <header className="sd-header">
          <span className="sd-header-icon"><FlaskConical size={15} strokeWidth={2} /></span>
          <div className="sd-title">
            Document test
            <div className="sd-subtitle">{report.total} checks · runs entirely on this device</div>
          </div>
          <button className="sd-close" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </header>

        <div className="sd-body">
          <div className="dt-summary">
            <div className="dt-pill dt-pass">{report.passed} passed</div>
            <div className="dt-pill dt-warn">{report.warnings} warnings</div>
            <div className="dt-pill dt-error">{report.errors} errors</div>
            <button className="sd-btn" style={{ marginLeft: 'auto', height: 24, padding: '0 10px', fontSize: 11 }} onClick={onClose} title="Re-run happens each time you open the test">
              <RotateCcw size={11} strokeWidth={2.2} />
              Re-run
            </button>
          </div>

          <div className="dt-list">
            {report.results.map((r) => (
              <button
                key={r.id}
                className={`dt-row dt-${STATUS_META[r.status].cls}`}
                onClick={() => goTo(r.blockId)}
                disabled={!r.blockId}
                title={r.blockId ? 'Jump to location' : STATUS_META[r.status].label}
              >
                <span className={`dt-icon dt-${STATUS_META[r.status].cls}`}>{STATUS_META[r.status].icon}</span>
                <span className="dt-label">{r.label}</span>
                <span className="dt-detail">{r.detail}</span>
              </button>
            ))}
          </div>
        </div>

        <footer className="sd-footer">
          <span className="sd-footer-note">Like CI for your writing — run before sharing or submitting.</span>
          <button className="sd-btn sd-btn-primary" onClick={onClose}>Done</button>
        </footer>
      </div>
    </div>
  );
};
