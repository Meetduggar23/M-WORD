/* eslint-disable react-refresh/only-export-components -- hooks co-located with their UI */
import React, { useCallback, useState } from 'react';
import {
  Wand2, Lightbulb, ArrowDownWideNarrow, Expand, Baby, GraduationCap,
  Briefcase, SpellCheck2, Languages, Copy, Check, X, ArrowDownToLine,
  Replace, AlertTriangle, Loader2, Lock,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useToast } from '../toast/Toast';
import { aiService } from '../../features/ai/aiService';
import { AIProviderError } from '../../features/ai/types';
import './inlineAI.css';

export interface InlineSuggestion {
  instruction: string;
  original: string;
  suggested: string;
}

interface InlineAIState {
  loading: boolean;
  error: string | null;
  suggestion: InlineSuggestion | null;
  /** Instruction behind the current state — powers Retry */
  lastInstruction: string | null;
}

interface InlineAIReturn extends InlineAIState {
  run: (instruction: string) => Promise<void>;
  retry: () => Promise<void>;
  dismiss: () => void;
}

export const INLINE_ACTIONS: { id: string; label: string; instruction: string; icon: React.ReactNode }[] = [
  { id: 'rewrite', label: 'Rewrite', instruction: 'Rewrite this', icon: <Wand2 size={13} strokeWidth={2} /> },
  { id: 'improve', label: 'Improve', instruction: 'Improve the writing', icon: <Lightbulb size={13} strokeWidth={2} /> },
  { id: 'shorten', label: 'Shorten', instruction: 'Make this more concise', icon: <ArrowDownWideNarrow size={13} strokeWidth={2} /> },
  { id: 'expand', label: 'Expand', instruction: 'Expand on this', icon: <Expand size={13} strokeWidth={2} /> },
  { id: 'simplify', label: 'Simplify', instruction: 'Simplify this in plain language', icon: <Baby size={13} strokeWidth={2} /> },
  { id: 'formal', label: 'Formal', instruction: 'Make this formal', icon: <Briefcase size={13} strokeWidth={2} /> },
  { id: 'academic', label: 'Academic', instruction: 'Make this academic in tone', icon: <GraduationCap size={13} strokeWidth={2} /> },
  { id: 'professional', label: 'Professional', instruction: 'Make this professional', icon: <Briefcase size={13} strokeWidth={2} /> },
  { id: 'grammar', label: 'Fix grammar', instruction: 'Proofread this: fix grammar and spelling without changing meaning', icon: <SpellCheck2 size={13} strokeWidth={2} /> },
];

/** Hook that runs inline AI actions against the current selection. */
export function useInlineAI(): InlineAIReturn {
  const engine = useDocumentEngine();
  const { toast } = useToast();
  const [state, setState] = useState<InlineAIState>({ loading: false, error: null, suggestion: null, lastInstruction: null });

  const execute = useCallback(async (instruction: string, original: string) => {
    setState({ loading: true, error: null, suggestion: null, lastInstruction: instruction });
    try {
      const result = await aiService.complete([
        { role: 'system', content: instruction },
        { role: 'user', content: `Apply the instruction to this text. Reply with the resulting text only, no commentary.\n---\n${original}` },
      ]);
      const suggested = result.trim();
      if (!suggested) throw new AIProviderError('The provider returned an empty response.');
      setState({ loading: false, error: null, suggestion: { instruction, original, suggested }, lastInstruction: instruction });
    } catch (e) {
      const message = e instanceof AIProviderError ? e.message : 'The AI request failed. Check your connection or provider settings.';
      setState({ loading: false, error: message, suggestion: null, lastInstruction: instruction });
    }
  }, []);

  const run = useCallback(async (instruction: string) => {
    const original = engine.getSelectedText();
    if (!original.trim()) {
      toast('info', 'Select text first', 'Select the text you want the AI to work on.');
      return;
    }
    await execute(instruction, original);
  }, [engine, toast, execute]);

  const retry = useCallback(async () => {
    if (!state.lastInstruction) return;
    const original = engine.getSelectedText().trim() || state.suggestion?.original || '';
    if (!original) return;
    await execute(state.lastInstruction, original);
  }, [engine, state.lastInstruction, state.suggestion, execute]);

  const dismiss = useCallback(() => {
    setState({ loading: false, error: null, suggestion: null, lastInstruction: state.lastInstruction });
  }, [state.lastInstruction]);

  return { ...state, run, retry, dismiss };
}

/* ─── Suggestion card: Original / Suggested + explicit actions ────────────── */

export const SuggestionCard: React.FC<{
  suggestion: InlineSuggestion;
  style?: React.CSSProperties;
  onReplace: () => void;
  onInsertBelow: () => void;
  onDismiss: () => void;
}> = ({ suggestion, style, onReplace, onInsertBelow, onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(suggestion.suggested);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast('error', 'Copy failed', 'Clipboard access was blocked by the browser.');
    }
  };

  return (
    <div className="inline-suggestion" role="dialog" aria-label="AI suggestion" style={style}>
      <div className="is-header">
        <span className="is-badge"><Wand2 size={12} strokeWidth={2.2} /></span>
        <span className="is-title">AI suggestion</span>
        <span className="is-instruction">{suggestion.instruction}</span>
        <button className="is-close" onClick={onDismiss} aria-label="Dismiss suggestion" title="Dismiss">
          <X size={13} strokeWidth={2.4} />
        </button>
      </div>
      <div className="is-panes">
        <div className="is-pane">
          <div className="is-pane-label">Original</div>
          <div className="is-pane-text">{suggestion.original}</div>
        </div>
        <div className="is-pane is-pane-new">
          <div className="is-pane-label">Suggested</div>
          <div className="is-pane-text">{suggestion.suggested}</div>
        </div>
      </div>
      <div className="is-actions">
        <button className="is-btn is-btn-primary" onClick={onReplace} title="Replace the selected text">
          <Replace size={12} strokeWidth={2.2} />
          Replace
        </button>
        <button className="is-btn" onClick={onInsertBelow} title="Insert after the selection">
          <ArrowDownToLine size={12} strokeWidth={2.2} />
          Insert Below
        </button>
        <button className="is-btn" onClick={copy} title="Copy the suggestion">
          {copied ? <Check size={12} strokeWidth={2.4} /> : <Copy size={12} strokeWidth={2.2} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <span className="is-note">Nothing changes until you choose.</span>
      </div>
    </div>
  );
};

/* ─── Error / loading states ──────────────────────────────────────────────── */

export const InlineAIStatus: React.FC<{
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
  onOpenSettings: () => void;
}> = ({ loading, error, onRetry, onDismiss, onOpenSettings }) => {
  if (loading) {
    return (
      <div className="inline-ai-status" role="status">
        <Loader2 size={14} strokeWidth={2.2} className="is-spin" />
        Working…
        <button className="is-btn is-btn-ghost" onClick={onDismiss}>Cancel</button>
      </div>
    );
  }
  if (error) {
    const notConfigured = /not configured/i.test(error);
    return (
      <div className="inline-ai-status is-error" role="alert">
        <AlertTriangle size={13} strokeWidth={2.2} />
        <span className="is-error-text">
          {notConfigured
            ? 'AI provider not configured. Configure one in Settings → AI & Privacy.'
            : error}
        </span>
        {notConfigured && (
          <button className="is-btn is-btn-primary" onClick={onOpenSettings}>
            <Lock size={11} strokeWidth={2.2} />
            Settings
          </button>
        )}
        {!notConfigured && (
          <button className="is-btn" onClick={onRetry}>Retry</button>
        )}
        <button className="is-btn is-btn-ghost" onClick={onDismiss} aria-label="Dismiss">Dismiss</button>
      </div>
    );
  }
  return null;
};

/* ─── AI actions dropdown menu (used by the floating toolbar) ─────────────── */

export const InlineAIMenu: React.FC<{
  onRun: (instruction: string) => void;
  onTranslate: () => void;
}> = ({ onRun, onTranslate }) => (
  <div className="inline-ai-menu" role="menu" aria-label="AI actions">
    {INLINE_ACTIONS.map((a) => (
      <button key={a.id} className="iam-item" role="menuitem" onClick={() => onRun(a.instruction)}>
        <span className="iam-icon">{a.icon}</span>
        {a.label}
      </button>
    ))}
    <div className="iam-sep" />
    <button className="iam-item" role="menuitem" onClick={onTranslate}>
      <span className="iam-icon"><Languages size={13} strokeWidth={2} /></span>
      Translate…
    </button>
  </div>
);
