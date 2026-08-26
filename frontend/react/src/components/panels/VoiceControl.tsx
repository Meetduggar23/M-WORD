import React, { useCallback, useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useUI } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../toast/Toast';
import { useCommands } from '../../features/commands/registry';
import { useSharedActions } from '../command/CommandPalette';
import {
  createVoiceController, isSpeechSupported, VoiceInterpretation,
} from '../../features/speech/voice';
import './VoiceControl.css';

/**
 * Voice command button for the status bar.
 * Speech → text → command grammar → command registry execution.
 */
export const VoiceControl: React.FC = () => {
  const ui = useUI();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const shared = useSharedActions();

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  const commands = useCommands({
    toast: (k, t, d) => toast(k, t, d),
    setTheme,
    theme,
    openAskAI: shared.openAskAI,
    runInlineAI: shared.runInlineAI,
    insertMarkdown: shared.insertMarkdown,
    insertSmartRef: shared.insertSmartRef,
    updateSmartRefs: shared.updateSmartRefs,
    takeSnapshot: shared.takeSnapshot,
    openDiff: shared.openDiff,
  });

  const execute = useCallback((interp: VoiceInterpretation, raw: string) => {
    setListening(false);
    if (!interp) {
      toast('info', 'Heard nothing usable');
      return;
    }
    if (interp.kind === 'text') {
      // Not a command — offer AI
      shared.openAskAI(raw);
      return;
    }
    // Command id from voice grammar maps to registry ids
    const map: Record<string, string> = {
      'ai.bold': 'fmt.bold',
      'ai.italic': 'fmt.italic',
      'ai.underline': 'fmt.underline',
      'table.insert': 'ins.table',
      'ai.summarize': 'ai.summarize',
      'nav.goto': 'view.outline',
      'theme.dark': 'view.theme',
      'theme.light': 'view.theme',
      'doc.health': 'ai.health',
      'doc.test': 'doc.test',
      'edit.save': 'doc.save',
      'palette.open': 'palette.open',
    };
    const registryId = map[interp.id];
    const cmd = commands.find((c) => c.id === registryId);
    if (cmd) {
      toast('info', `Voice: “${raw}”`);
      cmd.action();
    } else if (interp.id === 'nav.goto' && interp.args?.target) {
      // Semantic jump via the brain index
      ui.setNavView('search');
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('word:semantic-search', { detail: interp.args?.target }));
      }, 60);
    } else {
      toast('info', 'Command not recognized', `“${raw}” — try “make this bold” or “run document test”.`);
    }
  }, [commands, shared, toast, ui]);

  const start = useCallback(() => {
    if (!isSpeechSupported()) {
      toast('info', 'Voice not supported', 'Your browser does not expose the Web Speech API. Try Chrome or Edge.');
      return;
    }
    const controller = createVoiceController();
    setBusy(true);
    controller.start(
      (interp, raw) => {
        setBusy(false);
        execute(interp, raw);
      },
      (message) => {
        setBusy(false);
        setListening(false);
        toast('error', 'Voice error', message);
      },
    );
    setListening(true);
    // Single-shot listening: auto-stop after 7s of silence handled by onend
    window.setTimeout(() => setBusy(false), 400);
  }, [execute, toast]);

  if (!listening && !busy) {
    return (
      <button
        className="voice-btn"
        onClick={start}
        title="Voice command — try “make this bold” or “run document test”"
        aria-label="Start voice command"
      >
        <Mic size={13} strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      className="voice-btn listening"
      onClick={() => setListening(false)}
      title="Listening… click to cancel"
      aria-label="Cancel voice command"
    >
      <Loader2 size={13} strokeWidth={2.2} className="voice-spin" />
    </button>
  );
};
