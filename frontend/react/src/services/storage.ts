/* ============================================================
   Local persistence — app preferences & recent documents
   ============================================================ */

const PREFS_KEY = 'word.prefs';
const RECENTS_KEY = 'word.recents';

export interface AppPrefs {
  autosave: boolean;
  spellCheck: boolean;
  showStatusBarHints: boolean;
  defaultZoom: number;
  userName: string;
}

const DEFAULT_PREFS: AppPrefs = {
  autosave: true,
  spellCheck: true,
  showStatusBarHints: true,
  defaultZoom: 100,
  userName: 'Meet',
};

export function loadPrefs(): AppPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<AppPrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: AppPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* quota or privacy mode — non-fatal */
  }
}

/* ---------- Recent documents ---------- */

export interface RecentDoc {
  id: string;
  title: string;
  /** Serialized document snapshot (WORD native JSON) */
  snapshot: string;
  openedAt: number;
}

const MAX_RECENTS = 8;

export function loadRecents(): RecentDoc[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is RecentDoc =>
        typeof d?.id === 'string' && typeof d?.title === 'string' && typeof d?.snapshot === 'string',
    );
  } catch {
    return [];
  }
}

/** Upsert a document into recents. Returns the stored list (or previous list on failure). */
export function upsertRecent(id: string, title: string, snapshot: string): RecentDoc[] {
  const entry: RecentDoc = { id, title, snapshot, openedAt: Date.now() };
  let list = loadRecents().filter((d) => d.id !== id);
  list.unshift(entry);
  list = list.slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
  } catch {
    // Snapshot too large for storage — retry with snapshots trimmed off the tail
    try {
      list = list.slice(0, 3);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
    } catch {
      /* give up silently */
    }
  }
  return list;
}

export function removeRecent(id: string): RecentDoc[] {
  const list = loadRecents().filter((d) => d.id !== id);
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
