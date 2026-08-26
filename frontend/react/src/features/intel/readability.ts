/* ============================================================
   Readability & text statistics — Flesch Reading Ease and helpers.
   Pure functions, fully offline.
   ============================================================ */

export interface TextStats {
  words: number;
  sentences: number;
  syllables: number;
  avgWordsPerSentence: number;
  fleschReadingEase: number;
  /** 0–100, higher is easier */
  readingScore: number;
}

const VOWEL_GROUPS = /[aeiouy]+/g;

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.match(VOWEL_GROUPS);
  let count = groups ? groups.length : 1;
  if (/e$/.test(w) && count > 1) count -= 1;
  return Math.max(1, count);
}

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  const wordList = trimmed ? trimmed.split(/\s+/) : [];
  const words = wordList.length;
  const sentences = (trimmed.match(/[.!?]+(\s|$)/g) ?? []).length || (words ? 1 : 0);
  const syllables = wordList.reduce((acc, w) => acc + countSyllables(w), 0);

  const flesch = words && sentences
    ? 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    : 0;
  const readingScore = Math.max(0, Math.min(100, Math.round(flesch)));

  return {
    words,
    sentences,
    syllables,
    avgWordsPerSentence: sentences ? Math.round(words / sentences) : 0,
    fleschReadingEase: Math.round(flesch * 10) / 10,
    readingScore,
  };
}

export function readingTimeMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}
