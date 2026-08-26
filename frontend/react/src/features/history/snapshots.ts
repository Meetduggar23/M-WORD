/* ============================================================
   Snapshot store — lightweight version history per document.
   Stores compressed JSON snapshots with word counts; capped per
   document to respect localStorage quotas.
   ============================================================ */

export interface DocSnapshot {
  id: string;
  title: string;
  createdAt: number;
  /** Serialized document JSON */
  data: string;
  words: number;
  /** Optional label, e.g. "Manual snapshot" */
  label: string;
}

const KEY = 'word.snapshots';
const MAX_PER_DOC = 12;

export function loadSnapshots(docId: string): DocSnapshot[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, DocSnapshot[]>;
    return Array.isArray(all[docId]) ? all[docId] : [];
  } catch {
    return [];
  }
}

function persist(docId: string, list: DocSnapshot[]): void {
  try {
    const raw = localStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, DocSnapshot[]>) : {};
    all[docId] = list;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Quota exceeded — drop the oldest snapshots for this doc and retry once
    try {
      const raw = localStorage.getItem(KEY);
      const all = raw ? (JSON.parse(raw) as Record<string, DocSnapshot[]>) : {};
      all[docId] = list.slice(0, 4);
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* give up silently */
    }
  }
}

export function addSnapshot(docId: string, snapshot: Omit<DocSnapshot, 'id' | 'createdAt'>): DocSnapshot[] {
  const entry: DocSnapshot = {
    ...snapshot,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    createdAt: Date.now(),
  };
  const list = [entry, ...loadSnapshots(docId)].slice(0, MAX_PER_DOC);
  persist(docId, list);
  return list;
}

export function deleteSnapshot(docId: string, snapshotId: string): DocSnapshot[] {
  const list = loadSnapshots(docId).filter((s) => s.id !== snapshotId);
  persist(docId, list);
  return list;
}

export function getSnapshot(docId: string, snapshotId: string): DocSnapshot | undefined {
  return loadSnapshots(docId).find((s) => s.id === snapshotId);
}

export function formatSnapshotTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatSnapshotDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday
    ? 'Today'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
