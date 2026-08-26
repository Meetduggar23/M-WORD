/* ============================================================
   Writing goals — daily word count tracked locally per date.
   ============================================================ */

const KEY = 'word.goal.daily';

export interface DailyGoalState {
  date: string;
  words: number;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getWordsToday(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const state = JSON.parse(raw) as DailyGoalState;
    return state.date === todayKey() ? Math.max(0, state.words) : 0;
  } catch {
    return 0;
  }
}

export function addWordsToday(delta: number): number {
  if (delta <= 0) return getWordsToday();
  const total = getWordsToday() + delta;
  try {
    localStorage.setItem(KEY, JSON.stringify({ date: todayKey(), words: total } satisfies DailyGoalState));
  } catch {
    /* non-fatal */
  }
  return total;
}
