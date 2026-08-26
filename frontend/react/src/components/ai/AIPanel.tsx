import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sparkles, X, SendHorizontal, Copy, CheckSquare, ArrowDownToLine,
  FileSearch, Loader2, Lock, Cloud, Settings2, BookOpenText,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import { useToast } from '../toast/Toast';
import { useDocumentBrain } from '../../features/brain/DocumentBrainProvider';
import { aiService } from '../../features/ai/aiService';
import { AIProviderError, AIContextScope } from '../../features/ai/types';
import { retrieveForQuestion } from '../../features/brain/indexer';
import './AIPanel.css';

interface SourceRef {
  blockId: string;
  heading: string;
  page: number;
  snippet: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceRef[];
  /** Assistant messages that produced replacement text can be applied */
  actionable?: boolean;
  error?: boolean;
}

const QUICK_ACTIONS = [
  { id: 'improve', label: 'Improve writing', instruction: 'Improve the writing' },
  { id: 'rewrite', label: 'Rewrite', instruction: 'Rewrite this' },
  { id: 'summarize', label: 'Summarize', instruction: 'Summarize this' },
  { id: 'concise', label: 'Make concise', instruction: 'Make this more concise' },
  { id: 'expand', label: 'Expand', instruction: 'Expand on this' },
  { id: 'explain', label: 'Explain', instruction: 'Explain this' },
] as const;

let nextMsgId = 1;

const SCOPE_LABELS: Record<AIContextScope, string> = {
  selection: 'Selection',
  paragraph: 'Paragraph',
  section: 'Section',
  page: 'Page',
  document: 'Entire document',
};

export const AIPanel: React.FC = () => {
  const engine = useDocumentEngine();
  const { setRightPanel, openDialog } = useUI();
  const { toast } = useToast();
  const { index, indexing } = useDocumentBrain();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  /* External triggers: command palette & voice */
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      if (q) void askDocument(q);
    };
    const onInline = (e: Event) => {
      const instruction = (e as CustomEvent<string>).detail;
      if (instruction) void runAction(instruction, instruction);
    };
    window.addEventListener('word:ask-ai', onAsk);
    window.addEventListener('word:inline-ai', onInline);
    return () => {
      window.removeEventListener('word:ask-ai', onAsk);
      window.removeEventListener('word:inline-ai', onInline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  /** Text the AI is allowed to see, per the configured context scope. */
  const contextForScope = useCallback((): { text: string; scope: AIContextScope } => {
    const scope = aiService.getContextScope();
    const selected = engine.getSelectedText();
    if (scope === 'selection' && selected.trim()) return { text: selected, scope };
    if (scope === 'document' || scope === 'page' || scope === 'section' || scope === 'paragraph') {
      // Paragraph/section/page approximated from the cursor block's chunk;
      // document scope uses full text.
      if (scope === 'document') return { text: engine.getAllText(), scope };
      const chunk = index.chunks.find((c) => c.blockId === engine.cursorPosition.blockId);
      return { text: chunk?.text ?? selected ?? engine.getAllText(), scope };
    }
    return { text: selected || engine.getAllText(), scope };
  }, [engine, index]);

  const runAction = useCallback(async (label: string, instruction: string) => {
    if (thinking) return;
    const { text, scope } = contextForScope();
    if (!text.trim()) {
      toast('info', 'Nothing to work with yet', 'Write or select some text first, then try an AI action.');
      return;
    }
    const hadSelection = !!engine.getSelectedText().trim();
    setMessages((m) => [...m, { id: nextMsgId++, role: 'user', content: label }]);
    setThinking(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await aiService.complete(
        [
          { role: 'system', content: instruction },
          { role: 'user', content: `Context (${SCOPE_LABELS[scope].toLowerCase()}):\n---\n${text}` },
        ],
        { signal: controller.signal },
      );
      setThinking(false);
      setMessages((m) => [
        ...m,
        { id: nextMsgId++, role: 'assistant', content: result.trim(), actionable: hadSelection },
      ]);
    } catch (e) {
      setThinking(false);
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const message = e instanceof AIProviderError ? e.message : 'The AI request failed.';
      setMessages((m) => [...m, { id: nextMsgId++, role: 'assistant', content: message, error: true }]);
    }
  }, [thinking, contextForScope, engine, toast]);

  /** Ask Document — retrieval-augmented: only indexed chunks are sent. */
  const askDocument = useCallback(async (question: string) => {
    if (thinking) return;
    setMessages((m) => [...m, { id: nextMsgId++, role: 'user', content: question }]);
    setThinking(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { chunks, contextText } = retrieveForQuestion(index, question, 6);
      const sources: SourceRef[] = chunks.map((c) => ({
        blockId: c.blockId,
        heading: c.heading,
        page: c.page,
        snippet: c.text.slice(0, 140),
      }));

      let answer: string;
      if (!contextText) {
        answer = 'I could not find anything related to that in this document. Try different wording or add more content.';
      } else {
        answer = await aiService.complete(
          [
            {
              role: 'system',
              content:
                'You answer questions about a document using ONLY the provided excerpts. ' +
                'Cite sources inline like [1], [2]. If the excerpts do not contain the answer, say so plainly.',
            },
            { role: 'user', content: `Document excerpts:\n${contextText}\n\nQuestion: ${question}` },
          ],
          { signal: controller.signal },
        );
      }
      setThinking(false);
      setMessages((m) => [...m, { id: nextMsgId++, role: 'assistant', content: answer.trim(), sources }]);
    } catch (e) {
      setThinking(false);
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const message = e instanceof AIProviderError ? e.message : 'The AI request failed.';
      setMessages((m) => [...m, { id: nextMsgId++, role: 'assistant', content: message, error: true }]);
    }
  }, [thinking, index]);

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput('');
    void askDocument(q);
  }, [input, thinking, askDocument]);

  const applyLastResponse = useCallback(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.error);
    if (!lastAssistant) return;
    if (engine.getSelectedText().trim()) {
      engine.deleteBackward();
      engine.insertText(lastAssistant.content);
    } else {
      engine.insertText(`\n${lastAssistant.content}\n`);
    }
    toast('success', 'Inserted into document');
  }, [messages, engine, toast]);

  const goToSource = useCallback((blockId: string) => {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-block-id="${blockId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const copyResponse = useCallback(async (id: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast('error', 'Copy failed', 'Clipboard access was blocked by the browser.');
    }
  }, [toast]);

  const privacy = aiService.privacy;
  const scope = aiService.getContextScope();

  return (
    <aside className="ai-panel panel-enter-right" aria-label="AI Assistant">
      <header className="ai-header">
        <div className="ai-header-title">
          <span className="ai-badge">
            <Sparkles size={14} strokeWidth={2.2} />
          </span>
          <div>
            <div className="ai-title">AI Assistant</div>
            <div className={`ai-subtitle${privacy === 'device' ? ' private' : ''}`}>
              {privacy === 'device' ? (
                <>
                  <Lock size={10} strokeWidth={2.4} />
                  On-device — nothing leaves this machine
                </>
              ) : (
                <>
                  <Cloud size={10} strokeWidth={2.4} />
                  Cloud provider — excerpts are sent for requests
                </>
              )}
            </div>
          </div>
        </div>
        <div className="ai-header-actions">
          <button
            className="ai-config-btn"
            onClick={() => openDialog('settings')}
            title={`AI settings — provider, model, context (currently: ${SCOPE_LABELS[scope]})`}
            aria-label="AI settings"
          >
            <Settings2 size={14} strokeWidth={2} />
          </button>
          <button
            className="ai-close"
            onClick={() => setRightPanel(null)}
            aria-label="Close AI assistant"
            title="Close"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <div className="ai-scroll" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="ai-empty">
            <div className="ai-empty-icon">
              <BookOpenText size={22} strokeWidth={1.8} />
            </div>
            <div className="ai-empty-title">Ask your document</div>
            <div className="ai-empty-hint">
              {index.chunks.length
                ? `${index.chunks.length} passages indexed. Ask anything — answers cite their sources.`
                : 'Start writing, then ask questions about the content.'}
            </div>
            <div className="ai-actions">
              {QUICK_ACTIONS.map((a) => (
                <button key={a.id} className="ai-action-chip" onClick={() => void runAction(a.label, a.instruction)}>
                  <Sparkles size={12} strokeWidth={2.4} className="chip-spark" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`ai-message ai-message-${m.role}`}>
            <div className={`ai-bubble${m.error ? ' ai-bubble-error' : ''}`}>{m.content}</div>
            {m.sources && m.sources.length > 0 && (
              <div className="ai-sources">
                <div className="ai-sources-label">
                  <FileSearch size={11} strokeWidth={2.2} />
                  Sources
                </div>
                {m.sources.map((s, i) => (
                  <button key={`${s.blockId}-${i}`} className="ai-source" onClick={() => goToSource(s.blockId)} title="Jump to source">
                    <span className="ai-source-num">[{i + 1}]</span>
                    <span className="ai-source-heading">{s.heading}</span>
                    <span className="ai-source-page">Page {s.page}</span>
                  </button>
                ))}
              </div>
            )}
            {m.role === 'assistant' && !m.error && (
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
              <Loader2 size={13} strokeWidth={2.2} className="ai-spin" />
              <span className="ai-thinking-label">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      <footer className="ai-input-row">
        <input
          className="ai-input"
          placeholder={indexing ? 'Indexing document…' : 'Ask about this document…'}
          value={input}
          disabled={indexing && !messages.length}
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
