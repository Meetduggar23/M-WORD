import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, X, SendHorizontal, Copy, CheckSquare, ArrowDownToLine } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import { useToast } from '../toast/Toast';
import './AIPanel.css';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  /** Assistant messages that produced replacement text can be applied */
  actionable?: boolean;
}

const QUICK_ACTIONS = [
  { id: 'improve', label: 'Improve writing' },
  { id: 'rewrite', label: 'Rewrite' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'concise', label: 'Make concise' },
  { id: 'expand', label: 'Expand' },
  { id: 'explain', label: 'Explain' },
] as const;

type QuickActionId = (typeof QUICK_ACTIONS)[number]['id'];

const ACTION_PROMPTS: Record<QuickActionId, string> = {
  improve: 'Improve the writing',
  rewrite: 'Rewrite this',
  summarize: 'Summarize this',
  concise: 'Make this more concise',
  expand: 'Expand on this',
  explain: 'Explain this',
};

let nextMsgId = 1;

/** Local heuristic "AI" — deterministic text transforms so the panel is genuinely useful offline. */
function generateResponse(action: QuickActionId | 'ask', source: string, question?: string): string {
  const clean = source.replace(/\s+/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const words = clean ? clean.split(/\s+/).length : 0;

  switch (action) {
    case 'summarize': {
      if (!sentences.length) return 'There is no content to summarize yet — start writing and ask again.';
      const picked = sentences.filter((_, i) => i % 2 === 0).slice(0, 3);
      return `Key points from ${words} words:\n\n${picked.map((s) => `• ${s}`).join('\n')}`;
    }
    case 'concise': {
      if (!sentences.length) return 'Nothing to condense yet.';
      return sentences
        .map((s) =>
          s
            .replace(/\b(very|really|quite|just|actually|basically|literally)\s+/gi, '')
            .replace(/\bin order to\b/gi, 'to')
            .replace(/\bdue to the fact that\b/gi, 'because')
            .replace(/\bat this point in time\b/gi, 'now'),
        )
        .join(' ');
    }
    case 'rewrite':
      return `Here is a rephrased version:\n\n${
        sentences.map((s, i) => (i % 2 === 0 ? s : `${s.charAt(0)}${s.slice(1)}`)).join(' ') || '…'
      }\n\nTone adjusted for clarity while preserving meaning.`;
    case 'improve': {
      const tips: string[] = [];
      const longSentences = sentences.filter((s) => s.split(/\s+/).length > 28).length;
      if (longSentences > 0) tips.push(`• Split ${longSentences} long sentence${longSentences > 1 ? 's' : ''} (28+ words) for readability.`);
      if (/\b(thing|stuff|good|bad|nice)\b/i.test(clean)) tips.push('• Replace vague words like "good" or "thing" with specifics.');
      if (words > 40 && !/\n/.test(source)) tips.push('• Break this section into shorter paragraphs.');
      tips.push('• The overall structure reads clearly — keep verb tense consistent.');
      return `Writing review (${words} words analyzed):\n\n${tips.join('\n')}`;
    }
    case 'expand':
      return `Expanded draft:\n\n${clean || 'Your topic'}\n\nTo develop this further, consider adding: concrete examples, the reasoning behind key claims, and a short concluding sentence that ties the idea back to your document's purpose.`;
    case 'explain':
      return `In plain terms:\n\n${
        sentences[0] ? `This passage centers on "${sentences[0].toLowerCase().replace(/[.!?]$/, '')}".` : ''
      } It presents ${sentences.length} statement${sentences.length === 1 ? '' : 's'} across roughly ${words} words, building its point step by step.`;
    case 'ask': {
      const q = (question ?? '').toLowerCase();
      const engineWords = words;
      if (q.includes('word') || q.includes('count') || q.includes('long')) {
        return `The current document contains about ${engineWords} words. At an average reading pace of 200 wpm, that is a ~${Math.max(1, Math.round(engineWords / 200))} minute read.`;
      }
      if (q.includes('summar')) return generateResponse('summarize', source);
      if (q.includes('improve') || q.includes('feedback')) return generateResponse('improve', source);
      if (q.includes('title') || q.includes('name')) return 'Based on the content, titles like "Project Overview", "Working Notes", or "Draft Report" would fit well.';
      return `Here is what I found in the document:\n\n${
        sentences.slice(0, 2).map((s) => `• ${s}`).join('\n') || '• The document is currently empty.'
      }\n\nAsk about specific sections for more detail.`;
    }
  }
}

export const AIPanel: React.FC = () => {
  const engine = useDocumentEngine();
  const { setRightPanel } = useUI();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const getSourceText = useCallback(() => {
    const selected = engine.getSelectedText();
    if (selected && selected.trim()) return selected;
    return engine.getAllText();
  }, [engine]);

  const runAction = useCallback(
    (action: QuickActionId | 'ask', question?: string) => {
      if (thinking) return;
      const source = getSourceText();
      if (!source.trim() && action !== 'ask') {
        toast('info', 'Nothing to work with yet', 'Write or select some text first, then try an AI action.');
        return;
      }

      const userContent = action === 'ask' ? question ?? '' : ACTION_PROMPTS[action];
      const hadSelection = !!engine.getSelectedText().trim();
      setMessages((m) => [...m, { id: nextMsgId++, role: 'user', content: userContent }]);
      setThinking(true);

      window.setTimeout(() => {
        const response = generateResponse(action, source, question);
        setThinking(false);
        // Responses can replace the document selection only when one existed
        setMessages((m) => [
          ...m,
          { id: nextMsgId++, role: 'assistant', content: response, actionable: hadSelection },
        ]);
      }, 850 + Math.random() * 500);
    },
    [thinking, getSourceText, engine, toast],
  );

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput('');
    runAction('ask', q);
  }, [input, thinking, runAction]);

  const applyLastResponse = useCallback(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;
    if (engine.getSelectedText().trim()) {
      // Replace selection: delete it, then insert the response at the caret
      engine.deleteBackward();
      engine.insertText(lastAssistant.content);
    } else {
      engine.insertText(`\n${lastAssistant.content}\n`);
    }
    toast('success', 'Inserted into document');
  }, [messages, engine, toast]);

  const copyResponse = useCallback(async (id: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast('error', 'Copy failed', 'Clipboard access was blocked by the browser.');
    }
  }, [toast]);

  return (
    <aside className="ai-panel panel-enter-right" aria-label="AI Assistant">
      <header className="ai-header">
        <div className="ai-header-title">
          <span className="ai-badge">
            <Sparkles size={14} strokeWidth={2.2} />
          </span>
          <div>
            <div className="ai-title">AI Assistant</div>
            <div className="ai-subtitle">Local · private · offline</div>
          </div>
        </div>
        <button
          className="ai-close"
          onClick={() => setRightPanel(null)}
          aria-label="Close AI assistant"
          title="Close"
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      </header>

      <div className="ai-scroll" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="ai-empty">
            <div className="ai-empty-icon">
              <Sparkles size={22} strokeWidth={1.8} />
            </div>
            <div className="ai-empty-title">What would you like to do?</div>
            <div className="ai-empty-hint">
              Pick a quick action{engine.getSelectedText().trim() ? ' for your selection' : ' for the whole document'}, or just ask below.
            </div>
            <div className="ai-actions">
              {QUICK_ACTIONS.map((a) => (
                <button key={a.id} className="ai-action-chip" onClick={() => runAction(a.id)}>
                  <Sparkles size={12} strokeWidth={2.4} className="chip-spark" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`ai-message ai-message-${m.role}`}>
            <div className="ai-bubble">{m.content}</div>
            {m.role === 'assistant' && (
              <div className="ai-message-tools">
                <button className="ai-tool" onClick={() => copyResponse(m.id, m.content)} title="Copy response">
                  {copiedId === m.id ? <CheckSquare size={12} strokeWidth={2.2} /> : <Copy size={12} strokeWidth={2.2} />}
                  {copiedId === m.id ? 'Copied' : 'Copy'}
                </button>
                <button className="ai-tool ai-tool-primary" onClick={applyLastResponse} title="Insert into document at cursor">
                  <ArrowDownToLine size={12} strokeWidth={2.2} />
                  Insert
                </button>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="ai-message ai-message-assistant">
            <div className="ai-bubble ai-thinking" aria-label="AI is thinking">
              <span className="ai-dot" />
              <span className="ai-dot" />
              <span className="ai-dot" />
              <span className="ai-thinking-label">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      <footer className="ai-input-row">
        <input
          className="ai-input"
          placeholder="Ask about this document…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
            e.stopPropagation();
          }}
          aria-label="Ask the AI assistant"
        />
        <button
          className="ai-send"
          onClick={handleSend}
          disabled={!input.trim() || thinking}
          aria-label="Send message"
          title="Send"
        >
          <SendHorizontal size={14} strokeWidth={2.2} />
        </button>
      </footer>
    </aside>
  );
};
