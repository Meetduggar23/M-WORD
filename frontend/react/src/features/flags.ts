/* ============================================================
   Feature flags — lets unstable capabilities be switched off
   without code changes. Persisted per device.
   ============================================================ */

export type FeatureFlag =
  | 'documentBrain'
  | 'semanticSearch'
  | 'commandPalette'
  | 'documentHealth'
  | 'smartPaste'
  | 'documentTesting'
  | 'developerMode'
  | 'voiceCommands'
  | 'localAI'
  | 'writingGoals';

export const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  documentBrain: true,
  semanticSearch: true,
  commandPalette: true,
  documentHealth: true,
  smartPaste: true,
  documentTesting: true,
  developerMode: true,
  voiceCommands: true,
  localAI: true,
  writingGoals: true,
};

const FLAGS_KEY = 'word.flags';

export function loadFlags(): Record<FeatureFlag, boolean> {
  try {
    const raw = localStorage.getItem(FLAGS_KEY);
    if (!raw) return { ...DEFAULT_FLAGS };
    return { ...DEFAULT_FLAGS, ...(JSON.parse(raw) as Partial<Record<FeatureFlag, boolean>>) };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

export function saveFlags(flags: Record<FeatureFlag, boolean>): void {
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  } catch {
    /* non-fatal */
  }
}
