/* ============================================================
   Greeting Engine — time-aware, activity-aware, stable per session
   ============================================================ */

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface GreetingContext {
  userName: string;
  hour: number;
  recentDocs: { title: string; openedAt: number }[];
}

export interface GreetingResult {
  greeting: string;
  tagline: string;
  firstName: string;
}

/** Determine the time period from an hour (0-23). */
export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** Get the first name from a full name. */
export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

/** Generate initials from a name. */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Deterministic hash for avatar color from a string. */
export function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

/**
 * Main greeting function — returns the focused Home page greeting for the current period.
 */
export function getGreeting(ctx: GreetingContext): GreetingResult {
  const firstName = getFirstName(ctx.userName);
  const period = getTimePeriod(ctx.hour);
  const greeting = period === 'morning' ? 'Good Morning' :
    period === 'afternoon' ? 'Good Afternoon' :
    period === 'evening' ? 'Good Evening' :
    'Still Working?';
  const tagline = period === 'morning' ? 'Start fresh. Create something great.' :
    period === 'afternoon' ? 'Keep the ideas flowing.' :
    period === 'evening' ? 'Pick up where you left off.' :
    'Let’s finish something great.';

  return { greeting, tagline, firstName };
}

/**
 * Get a document-aware subtitle for the start page.
 * Returns a message that reflects the user's document activity.
 */
export function getDocumentSubtitle(recentDocs: { title: string; openedAt: number }[]): string {
  if (recentDocs.length === 0) {
    return 'Start with a blank page or choose a template.';
  }
  if (recentDocs.length === 1) {
    const doc = recentDocs[0];
    return `Continue working on "${doc.title}"?`;
  }
  return `You have ${recentDocs.length} documents waiting for your attention.`;
}
