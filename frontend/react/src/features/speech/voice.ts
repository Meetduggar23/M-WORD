/* ============================================================
   Voice commands — speech-to-command abstraction over the Web
   Speech API. Providers can be swapped; when the browser lacks
   support the UI surfaces a clear message instead of failing.
   ============================================================ */

export interface VoiceCommandMatch {
  kind: 'command';
  id: string;
  args?: Record<string, string | number>;
}

export interface VoiceTextMatch {
  kind: 'text';
  transcript: string;
}

export type VoiceInterpretation = VoiceCommandMatch | VoiceTextMatch | null;

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export interface SpeechEventLike {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { [j: number]: { transcript: string }; isFinal: boolean };
  };
}

type RecognitionCtor = new () => SpeechRecognitionLike;

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

function createRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as RecognitionCtor | undefined;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = navigator.language || 'en-US';
  rec.continuous = false;
  rec.interimResults = false;
  return rec;
}

/* ─── Command grammar ─────────────────────────────────────────────────────── */

interface GrammarRule {
  id: string;
  patterns: RegExp[];
}

const GRAMMAR: GrammarRule[] = [
  { id: 'ai.bold', patterns: [/make (this |the )?(heading |selection |text )?bold/i, /bold (this|that|it)/i] },
  { id: 'ai.italic', patterns: [/make (this |the )?(heading |selection |text )?italic/i] },
  { id: 'ai.underline', patterns: [/make (this |the )?(heading |selection |text )?underlined?/i] },
  { id: 'table.insert', patterns: [/insert a table( with (\d+|one|two|three|four|five|six|seven|eight|nine|ten) columns?)?/i, /add a table( with (\d+|one|two|three|four|five|six|seven|eight|nine|ten) columns?)?/i] },
  { id: 'ai.summarize', patterns: [/summarize (this|the) (document|section|selection)/i, /give me a summary/i] },
  { id: 'nav.goto', patterns: [/go to (.+)/i, /(jump|scroll) to (.+)/i] },
  { id: 'theme.dark', patterns: [/switch to dark mode/i, /dark mode/i] },
  { id: 'theme.light', patterns: [/switch to light mode/i, /light mode/i] },
  { id: 'doc.health', patterns: [/(show |run )?document health/i, /health check/i] },
  { id: 'doc.test', patterns: [/run document test/i, /document test/i] },
  { id: 'edit.save', patterns: [/save (the )?document/i] },
  { id: 'palette.open', patterns: [/open (the )?command palette/i] },
];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

export function interpretTranscript(transcript: string): VoiceInterpretation {
  const text = transcript.trim();
  if (!text) return null;

  for (const rule of GRAMMAR) {
    for (const pattern of rule.patterns) {
      const m = pattern.exec(text);
      if (!m) continue;
      const args: Record<string, string | number> = {};
      if (rule.id === 'table.insert' && m[2]) {
        const n = NUMBER_WORDS[m[2].toLowerCase()] ?? parseInt(m[2], 10);
        if (Number.isFinite(n)) args.columns = n;
      }
      if (rule.id === 'nav.goto' && (m[1] || m[2])) args.target = (m[1] || m[2]).trim();
      return { kind: 'command', id: rule.id, args };
    }
  }
  return { kind: 'text', transcript: text };
}

/* ─── Listener controller ─────────────────────────────────────────────────── */

export interface VoiceController {
  start(onResult: (interp: VoiceInterpretation, raw: string) => void, onError: (message: string) => void): void;
  stop(): void;
  readonly listening: boolean;
}

export function createVoiceController(): VoiceController {
  let rec: SpeechRecognitionLike | null = null;
  let listening = false;

  return {
    get listening() {
      return listening;
    },
    start(onResult, onError) {
      if (listening) return;
      rec = createRecognition();
      if (!rec) {
        onError('Voice input is not supported in this browser. Try Chrome or Edge.');
        return;
      }
      rec.onresult = (e) => {
        const result = e.results[e.resultIndex];
        const transcript = result?.[0]?.transcript ?? '';
        onResult(interpretTranscript(transcript), transcript);
      };
      rec.onerror = (e) => {
        listening = false;
        const messages: Record<string, string> = {
          'not-allowed': 'Microphone access was blocked. Allow it in your browser settings.',
          'no-speech': 'No speech detected — try again.',
          network: 'Speech service needs a network connection.',
        };
        onError(messages[e.error] ?? `Voice error: ${e.error}`);
      };
      rec.onend = () => {
        listening = false;
      };
      try {
        rec.start();
        listening = true;
      } catch {
        listening = false;
        onError('Could not start the microphone.');
      }
    },
    stop() {
      rec?.stop();
      listening = false;
    },
  };
}
