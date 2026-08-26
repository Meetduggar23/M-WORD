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

/* ── Tagline banks (indexed deterministically, not random) ── */

const MORNING_TAGLINES = [
  'Ready to get a fresh start?',
  'Start your day with a clean page.',
  'A fresh start. Let\'s make something great today.',
  'Ready to turn your ideas into something useful?',
  'The morning is yours — start writing.',
];

const AFTERNOON_TAGLINES = [
  'Keep the momentum going.',
  'Your documents are ready when you are.',
  'Let\'s get one more thing done today.',
  'Still going strong — keep it up.',
  'A productive afternoon starts here.',
];

const EVENING_TAGLINES = [
  'A little progress today goes a long way.',
  'Wrap up your ideas or start something new.',
  'Want to finish what you started?',
  'Evening is a great time to write.',
  'Wind down with some words on paper.',
];

const NIGHT_TAGLINES = [
  'One more document, or save it for tomorrow?',
  'Finish strong, or save it for tomorrow.',
  'Burning the midnight oil? We\'re here.',
  'Night owl mode — your documents are safe.',
  'Last push of the day — you\'ve got this.',
];

/** Activity-aware taglines shown when there are recent documents. */
const CONTINUE_TAGLINES: Record<TimePeriod, string[]> = {
  morning: [
    'Ready to pick up where you left off?',
    'Your recent work is waiting for you.',
  ],
  afternoon: [
    'Continue where you left off?',
    'Your documents are ready for you.',
  ],
  evening: [
    'Ready to pick up where you left off?',
    'Want to continue your last document?',
  ],
  night: [
    'Your last document is almost there.',
    'Finish what you started today.',
  ],
};

/** Select a tagline deterministically using a simple index based on hour + period. */
function pickTagline(bank: string[], seed: number): string {
  return bank[Math.abs(seed) % bank.length];
}

/** Stable hash from hour for deterministic selection within a time period. */
function periodSeed(hour: number): number {
  return hour * 7 + 13;
}

/**
 * Main greeting function — returns a stable greeting + tagline for the current session.
 * The result does NOT change between re-renders within the same hour.
 */
export function getGreeting(ctx: GreetingContext): GreetingResult {
  const firstName = getFirstName(ctx.userName);
  const period = getTimePeriod(ctx.hour);
  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
  const greeting = `Good ${periodLabel}, ${firstName}`;

  const seed = periodSeed(ctx.hour);

  /* Activity-aware tagline */
  if (ctx.recentDocs.length > 0) {
    const continueBank = CONTINUE_TAGLINES[period];
    const tagline = pickTagline(continueBank, seed);
    return { greeting, tagline, firstName };
  }

  /* Default tagline */
  const bank =
    period === 'morning' ? MORNING_TAGLINES :
    period === 'afternoon' ? AFTERNOON_TAGLINES :
    period === 'evening' ? EVENING_TAGLINES :
    NIGHT_TAGLINES;

  const tagline = pickTagline(bank, seed);
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
