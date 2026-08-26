/* ============================================================
   Local on-device provider — deterministic language tools that
   run entirely in the browser. Not a language model: it performs
   honest, rule-based writing analysis and transforms. The UI
   labels it "On-device tools" so users are never misled.
   ============================================================ */

import { AIProvider, AIProviderError, AICompletionOptions } from '../types';

const FILLERS = /\b(very|really|quite|just|actually|basically|literally|simply|totally)\s+/gi;
const WORDY: [RegExp, string][] = [
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bin the event that\b/gi, 'if'],
  [/\ba large number of\b/gi, 'many'],
  [/\bis able to\b/gi, 'can'],
  [/\bhas the ability to\b/gi, 'can'],
];

function splitSentences(text: string): string[] {
  return text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
}

function extractInstruction(messages: { role: string; content: string }[]): { instruction: string; source: string } {
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const user = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const sep = user.indexOf('\n---\n');
  if (system && sep >= 0) {
    return { instruction: system, source: user.slice(sep + 5) };
  }
  if (sep >= 0) return { instruction: user.slice(0, sep).trim(), source: user.slice(sep + 5) };
  return { instruction: system || user, source: system ? user : '' };
}

export class LocalProvider implements AIProvider {
  readonly kind = 'local' as const;
  readonly privacy = 'device' as const;

  async check() {
    return { ok: true, detail: 'On-device writing tools' };
  }

  async complete(opts: AICompletionOptions): Promise<string> {
    const { instruction, source } = extractInstruction(opts.messages);
    const clean = source.replace(/\s+/g, ' ').trim();
    const sentences = splitSentences(clean);
    const words = clean ? clean.split(/\s+/).length : 0;
    const instr = instruction.toLowerCase();

    if (!clean) {
      return 'The document (or selection) is empty, so there is nothing to analyze yet.';
    }

    if (/\bshorten|concise|tighten\b/.test(instr)) {
      return sentences
        .map((s) =>
          s.replace(FILLERS, '').replace(/,\s*,/g, ',')
            .replace(/\s+/g, ' ')
            .trim(),
        )
        .map((s) => WORDY.reduce((acc, [re, to]) => acc.replace(re, to), s))
        .join(' ');
    }

    if (/\bformal|professional|academic\b/.test(instr)) {
      const contractions: [RegExp, string][] = [
        [/\bdon't\b/gi, 'do not'], [/\bcan't\b/gi, 'cannot'], [/\bwon't\b/gi, 'will not'],
        [/\bit's\b/gi, 'it is'], [/\bthey're\b/gi, 'they are'], [/\bisn't\b/gi, 'is not'],
        [/\bdoesn't\b/gi, 'does not'], [/\bI'm\b/g, 'I am'],
      ];
      const out = sentences
        .map((s) => contractions.reduce((acc, [re, to]) => acc.replace(re, to), s))
        .map((s) => WORDY.reduce((acc, [re, to]) => acc.replace(re, to), s))
        .join(' ');
      return out;
    }

    if (/\bsimplif|simple|plain\b/.test(instr)) {
      return sentences
        .map((s) => WORDY.reduce((acc, [re, to]) => acc.replace(re, to), s.replace(FILLERS, '')))
        .join(' ');
    }

    if (/\bsummar|key points\b/.test(instr)) {
      if (!sentences.length) return 'Nothing to summarize yet.';
      const scored = sentences
        .map((s, i) => ({ s, i, score: s.split(/\s+/).length + (i === 0 ? 8 : 0) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(4, sentences.length))
        .sort((a, b) => a.i - b.i);
      return `Key points (${words} words condensed):\n\n${scored.map((x) => `- ${x.s}`).join('\n')}`;
    }

    if (/\bproofread|grammar|spelling\b/.test(instr)) {
      const issues: string[] = [];
      const doubles = clean.match(/\b(\w+)\s+\1\b/gi);
      if (doubles) issues.push(`Repeated words: ${doubles.slice(0, 3).map((d) => `"${d}"`).join(', ')}`);
      const lowerStarts = sentences.filter((s) => /^[a-z]/.test(s)).length;
      if (lowerStarts) issues.push(`${lowerStarts} sentence${lowerStarts > 1 ? 's' : ''} start with a lowercase letter.`);
      const spaced = clean.match(/\s{2,}/g);
      if (spaced) issues.push(`${spaced.length} place${spaced.length > 1 ? 's' : ''} with extra spaces.`);
      const missingPeriod = sentences.filter((s) => !/[.!?:;"')]$/.test(s)).length;
      if (missingPeriod) issues.push(`${missingPeriod} sentence${missingPeriod > 1 ? 's' : ''} may be missing ending punctuation.`);
      return issues.length
        ? `Proofreading findings:\n\n${issues.map((i) => `- ${i}`).join('\n')}`
        : 'No obvious mechanical issues found — punctuation, spacing and repeated words look clean.';
    }

    if (/\bimprove|review|feedback\b/.test(instr)) {
      const tips: string[] = [];
      const long = sentences.filter((s) => s.split(/\s+/).length > 28);
      if (long.length) tips.push(`- Split ${long.length} long sentence${long.length > 1 ? 's' : ''} (28+ words).`);
      if (/\b(thing|stuff|good|bad|nice)\b/i.test(clean)) tips.push('- Replace vague words like "good" or "thing" with specifics.');
      if (words > 120) tips.push('- Consider sub-headings to break up this length of text.');
      tips.push('- Keep verb tense consistent and lead each paragraph with its main claim.');
      return `Writing review (${words} words):\n\n${tips.join('\n')}`;
    }

    if (/\bexpand|elaborate\b/.test(instr)) {
      return `${clean}\n\nDirections you could develop further: a concrete example, the reasoning behind the central claim, and a closing line that ties the idea back to the document's purpose.`;
    }

    if (/\bexplain\b/.test(instr)) {
      return sentences[0]
        ? `In plain terms: this passage centers on "${sentences[0].toLowerCase().replace(/[.!?]$/, '')}" and makes ${sentences.length} point${sentences.length === 1 ? '' : 's'} across about ${words} words.`
        : 'Nothing to explain yet.';
    }

    if (/\brewrite|rephrase\b/.test(instr)) {
      const out = sentences
        .map((s, i) => (i % 2 === 0 ? s : s.replace(FILLERS, '')))
        .map((s) => WORDY.reduce((acc, [re, to]) => acc.replace(re, to), s))
        .join(' ');
      return out;
    }

    throw new AIProviderError(
      `The on-device tools handle shorten, formalize, simplify, summarize, proofread, review, expand, explain and rewrite. "${instruction.slice(0, 60)}" needs a language model — configure one in Settings.`,
    );
  }
}
