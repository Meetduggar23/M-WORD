import React, { useMemo, useState } from 'react';
import {
  History, X, Camera, GitCompare, RotateCcw, Trash2, Plus, Minus,
  ChevronUp, ChevronDown, Eye,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useToast } from '../toast/Toast';
import {
  loadSnapshots, deleteSnapshot, addSnapshot, getSnapshot,
  formatSnapshotTime, formatSnapshotDate, DocSnapshot,
} from '../../features/history/snapshots';
import { diffWords, diffStats, DiffPart } from '../../features/text/diff';
import { QuillDocument, Paragraph, Block } from '../../engine/DocumentEngine';
import './smartDialogs.css';
import './TimelineDialog.css';

function docPlainText(json: string): string {
  try {
    const doc = JSON.parse(json) as QuillDocument;
    return doc.sections
      .flatMap((s) => s.blocks as Block[])
      .filter((b): b is Paragraph => b.type === 'paragraph')
      .map((p) => p.textRuns.map((r) => r.text).join(''))
      .join('\n');
  } catch {
    return '';
  }
}

export const TimelineDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const { toast } = useToast();
  const docId = engine.document?.id ?? '';
  const [snapshots, setSnapshots] = useState<DocSnapshot[]>(() => loadSnapshots(docId));
  const [compareId, setCompareId] = useState<string | null>(null);

  const takeNow = () => {
    const list = addSnapshot(docId, {
      title: engine.document?.metadata.title || 'Untitled Document',
      data: engine.exportJSON(),
      words: engine.getWordCount(),
      label: 'Manual snapshot',
    });
    setSnapshots(list);
    toast('success', 'Snapshot saved');
  };

  const restore = (snap: DocSnapshot) => {
    const ok = window.confirm(
      `Restore “${snap.title}” from ${formatSnapshotTime(snap.createdAt)}?\n\nThe current document is kept on the undo stack (Ctrl+Z brings it back).`,
    );
    if (!ok) return;
    engine.importJSON(snap.data);
    toast('success', 'Version restored', `Back to ${formatSnapshotTime(snap.createdAt)}.`);
    onClose();
  };

  const remove = (id: string) => {
    setSnapshots(deleteSnapshot(docId, id));
  };

  const groups = useMemo(() => {
    const map = new Map<string, DocSnapshot[]>();
    for (const s of snapshots) {
      const key = formatSnapshotDate(s.createdAt);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()];
  }, [snapshots]);

  const compareSnap = compareId ? getSnapshot(docId, compareId) : null;

  if (compareSnap) {
    return <DiffViewDialog snapshot={compareSnap} onClose={() => setCompareId(null)} />;
  }

  return (
    <div className="sd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sd-dialog" role="dialog" aria-modal="true" aria-label="Document timeline">
        <header className="sd-header">
          <span className="sd-header-icon"><History size={15} strokeWidth={2} /></span>
          <div className="sd-title">
            Document timeline
            <div className="sd-subtitle">{snapshots.length} version{snapshots.length === 1 ? '' : 's'} stored on this device</div>
          </div>
          <button className="sd-btn" style={{ height: 26, padding: '0 11px', fontSize: 11 }} onClick={takeNow}>
            <Camera size={12} strokeWidth={2.1} />
            Snapshot now
          </button>
          <button className="sd-close" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </header>

        <div className="sd-body">
          {snapshots.length === 0 ? (
            <div className="sd-empty">
              <History size={28} strokeWidth={1.6} />
              <div className="sd-empty-title">No versions yet</div>
              <div className="sd-empty-hint">
                Take a snapshot before big edits. Snapshots stay on this device and can be restored or compared anytime.
              </div>
            </div>
          ) : (
            <div className="tl-wrap">
              {groups.map(([date, items]) => (
                <div key={date} className="tl-group">
                  <div className="tl-date">{date}</div>
                  {items.map((snap) => (
                    <div key={snap.id} className="tl-item">
                      <span className="tl-dot" />
                      <div className="tl-card">
                        <div className="tl-time">
                          {formatSnapshotTime(snap.createdAt)}
                          <span className="tl-label">{snap.label}</span>
                        </div>
                        <div className="tl-stats">
                          {snap.words.toLocaleString()} words · “{snap.title}”
                        </div>
                        <div className="tl-actions">
                          <button className="tl-btn" onClick={() => setCompareId(snap.id)} disabled={!snapshots.length}>
                            <GitCompare size={11} strokeWidth={2.2} />
                            Compare
                          </button>
                          <button className="tl-btn tl-btn-primary" onClick={() => restore(snap)}>
                            <RotateCcw size={11} strokeWidth={2.2} />
                            Restore
                          </button>
                          <button className="tl-btn tl-btn-danger" onClick={() => remove(snap.id)} aria-label="Delete snapshot">
                            <Trash2 size={11} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="sd-footer">
          <span className="sd-footer-note">Snapshots are deltas-friendly: word counts and diffs are computed on demand, full copies are capped at 12 per document.</span>
          <button className="sd-btn sd-btn-primary" onClick={onClose}>Done</button>
        </footer>
      </div>
    </div>
  );
};

/* ─── Visual diff view (Phase 16) ─────────────────────────────────────────── */

export const DiffViewDialog: React.FC<{ snapshot: DocSnapshot; onClose: () => void }> = ({ snapshot, onClose }) => {
  const engine = useDocumentEngine();
  const { toast } = useToast();

  const oldText = useMemo(() => docPlainText(snapshot.data), [snapshot.data]);
  const currentText = useMemo(() => engine.getAllText(), [engine]);

  const parts = useMemo(() => diffWords(oldText, currentText), [oldText, currentText]);
  const stats = useMemo(() => diffStats(parts), [parts]);

  const [onlyChanges, setOnlyChanges] = useState(false);
  const [cursor, setCursor] = useState(0);

  const changeIndexes = useMemo(
    () => parts.map((p, i) => (p.op !== 'equal' ? i : -1)).filter((i) => i >= 0),
    [parts],
  );

  const goToChange = (dir: 1 | -1) => {
    if (!changeIndexes.length) return;
    setCursor((c) => {
      const pos = changeIndexes.indexOf(c);
      const next = dir === 1
        ? changeIndexes[Math.min(changeIndexes.length - 1, pos + 1)]
        : changeIndexes[Math.max(0, pos - 1)];
      return next;
    });
    requestAnimationFrame(() => {
      document.querySelector('[data-diff-cursor="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const restore = () => {
    const ok = window.confirm(`Restore the snapshot from ${formatSnapshotTime(snapshot.createdAt)}? Current content stays on the undo stack.`);
    if (!ok) return;
    engine.importJSON(snapshot.data);
    toast('success', 'Version restored');
    onClose();
  };

  return (
    <div className="sd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sd-dialog sd-wide" role="dialog" aria-modal="true" aria-label="Document comparison">
        <header className="sd-header">
          <span className="sd-header-icon"><GitCompare size={15} strokeWidth={2} /></span>
          <div className="sd-title">
            Document comparison
            <div className="sd-subtitle">
              Snapshot {formatSnapshotTime(snapshot.createdAt)} vs current · <Plus size={10} strokeWidth={2.6} className="diff-legend diff-added" /> {stats.added} added · <Minus size={10} strokeWidth={2.6} className="diff-legend diff-removed" /> {stats.removed} removed
            </div>
          </div>
          <button className="sd-close" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </header>

        <div className="sd-body">
          <div className="diff-toolbar">
            <button className="sd-btn" style={{ height: 24, padding: '0 10px', fontSize: 11 }} onClick={() => goToChange(-1)} disabled={!changeIndexes.length}>
              <ChevronUp size={11} strokeWidth={2.2} />
              Previous
            </button>
            <button className="sd-btn" style={{ height: 24, padding: '0 10px', fontSize: 11 }} onClick={() => goToChange(1)} disabled={!changeIndexes.length}>
              <ChevronDown size={11} strokeWidth={2.2} />
              Next
            </button>
            <label className="diff-toggle">
              <input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} />
              Only changes
            </label>
            <span className="diff-count">{changeIndexes.length} change{changeIndexes.length === 1 ? '' : 's'}</span>
          </div>

          <div className="diff-body">
            {parts.length === 0 && <div className="sd-empty" style={{ padding: 20 }}>Nothing to compare yet.</div>}
            {parts.map((p: DiffPart, i) => {
              const isChange = p.op !== 'equal';
              if (onlyChanges && !isChange) return null;
              const isCursor = cursor === i && isChange;
              return (
                <span
                  key={i}
                  data-diff-cursor={isCursor || undefined}
                  className={`diff-part diff-${p.op}${isCursor ? ' diff-cursor' : ''}`}
                >
                  {p.text}
                </span>
              );
            })}
          </div>
        </div>

        <footer className="sd-footer">
          <span className="sd-footer-note"><Eye size={11} strokeWidth={2} /> Comparison is read-only — restoring is explicit and undoable.</span>
          <button className="sd-btn" onClick={onClose}>Close</button>
          <button className="sd-btn sd-btn-primary" onClick={restore}>
            <RotateCcw size={13} strokeWidth={2.2} />
            Restore snapshot
          </button>
        </footer>
      </div>
    </div>
  );
};

/** Diff opened without choosing a snapshot — uses the most recent one. */
export const DiffDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const snapshots = loadSnapshots(engine.document?.id ?? '');
  const [snap, setSnap] = useState<DocSnapshot | null>(snapshots[0] ?? null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!snap && !snapshots.length) {
      toast('info', 'No snapshots yet', 'Take a snapshot from the Document timeline first, then compare.');
      onClose();
    } else if (!snap && snapshots.length) {
      setSnap(snapshots[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!snap) return null;
  return <DiffViewDialog snapshot={snap} onClose={onClose} />;
};
