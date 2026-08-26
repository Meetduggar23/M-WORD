import React, { useMemo, useCallback, useState } from 'react';
import {
  Stethoscope, X, ShieldCheck, AlertTriangle, Info, CircleAlert,
  ArrowRight, Sparkles, Brush,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import { useToast } from '../toast/Toast';
import { analyzeHealth, categoryLabel, HealthIssue, HealthCategory } from '../../features/intel/health';
import './HealthPanel.css';

const CATEGORY_ORDER: HealthCategory[] = ['structure', 'readability', 'formatting', 'grammar', 'accessibility', 'references'];

function scoreColor(score: number): string {
  if (score >= 85) return '#16a34a';
  if (score >= 65) return '#d97706';
  return '#c42b1c';
}

export const HealthPanel: React.FC = () => {
  const engine = useDocumentEngine();
  const ui = useUI();
  const { toast } = useToast();
  const [ignored, setIgnored] = useState<Set<string>>(new Set());

  const report = useMemo(
    () => (engine.document ? analyzeHealth(engine.document) : null),
    [engine.document],
  );

  const issues = useMemo(() => {
    if (!report) return [];
    return report.issues.filter((i) => !ignored.has(i.id));
  }, [report, ignored]);

  const goToIssue = useCallback((blockId?: string) => {
    if (!blockId) return;
    requestAnimationFrame(() => {
      document.querySelector(`[data-block-id="${blockId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const applyFix = useCallback((issue: HealthIssue) => {
    if (!issue.fix) return;
    const changed = engine.transformDocument(issue.fix.apply);
    if (changed) {
      toast('success', 'Fix applied', issue.fix.label);
      setIgnored((s) => new Set(s).add(issue.id));
    } else {
      toast('info', 'Nothing to change');
    }
  }, [engine, toast]);

  const openCleanup = useCallback(() => ui.openDialog('cleanup'), [ui]);

  if (!report) return null;

  return (
    <aside className="health-panel panel-enter-right" aria-label="Document Health">
      <header className="hp-header">
        <div className="hp-title-row">
          <span className="hp-badge"><Stethoscope size={14} strokeWidth={2.2} /></span>
          <div className="hp-title">Document Health</div>
        </div>
        <button className="hp-close" onClick={() => ui.setRightPanel(null)} aria-label="Close health panel" title="Close">
          <X size={15} strokeWidth={2.2} />
        </button>
      </header>

      <div className="hp-scroll">
        {/* Overall score */}
        <div className="hp-overall">
          <div className="hp-score" style={{ color: scoreColor(report.overall) }}>
            {report.overall}
            <span className="hp-score-denom">/100</span>
          </div>
          <div className="hp-score-label">Overall health</div>
          <div className="hp-score-bar">
            <div className="hp-score-fill" style={{ width: `${report.overall}%`, background: scoreColor(report.overall) }} />
          </div>
        </div>

        {/* Category scores */}
        <div className="hp-categories">
          {report.scores
            .slice()
            .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
            .map((s) => (
              <div key={s.category} className="hp-category">
                <span className="hp-cat-label">{categoryLabel(s.category)}</span>
                <div className="hp-cat-bar">
                  <div className="hp-cat-fill" style={{ width: `${s.score}%`, background: scoreColor(s.score) }} />
                </div>
                <span className="hp-cat-score">{s.score}</span>
              </div>
            ))}
        </div>

        {/* Issues */}
        <div className="hp-issues-header">
          <span>{issues.length} issue{issues.length === 1 ? '' : 's'} found</span>
          <button className="hp-cleanup-btn" onClick={openCleanup} title="One-click cleanup with preview">
            <Brush size={12} strokeWidth={2.1} />
            Clean up
          </button>
        </div>

        {issues.length === 0 ? (
          <div className="hp-empty">
            <ShieldCheck size={26} strokeWidth={1.6} />
            <div className="hp-empty-title">No issues found</div>
            <div className="hp-empty-hint">Structure, formatting, accessibility and references look healthy.</div>
          </div>
        ) : (
          <div className="hp-issues">
            {issues.map((issue) => (
              <div key={issue.id} className="hp-issue" data-severity={issue.severity}>
                <span className="hp-issue-icon">
                  {issue.severity === 'error' ? <CircleAlert size={13} strokeWidth={2.1} />
                    : issue.severity === 'warning' ? <AlertTriangle size={13} strokeWidth={2.1} />
                    : <Info size={13} strokeWidth={2.1} />}
                </span>
                <div className="hp-issue-body">
                  <button className="hp-issue-title" onClick={() => goToIssue(issue.blockId)} disabled={!issue.blockId} title={issue.blockId ? 'Jump to location' : undefined}>
                    {issue.title}
                    {issue.blockId && <ArrowRight size={11} strokeWidth={2.2} />}
                  </button>
                  <div className="hp-issue-detail">{issue.detail}</div>
                  {issue.fix && (
                    <button className="hp-fix-btn" onClick={() => applyFix(issue)}>
                      <Sparkles size={11} strokeWidth={2.2} />
                      {issue.fix.label}
                    </button>
                  )}
                </div>
                <button
                  className="hp-ignore"
                  onClick={() => setIgnored((s) => new Set(s).add(issue.id))}
                  title="Ignore this issue"
                  aria-label={`Ignore ${issue.title}`}
                >
                  <X size={11} strokeWidth={2.4} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="hp-footer">
        {report.wordCount.toLocaleString()} words analyzed · rules run on this device
      </footer>
    </aside>
  );
};
