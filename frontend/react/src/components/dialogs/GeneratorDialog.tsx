import React, { useState } from 'react';
import { LayoutTemplate, X, Sparkles, Loader2, AlertTriangle, Lock, ListTree } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import { useToast } from '../toast/Toast';
import { aiService } from '../../features/ai/aiService';
import { AIProviderError } from '../../features/ai/types';
import './smartDialogs.css';

type DocKind =
  | 'Research Paper' | 'Project Report' | 'Resume' | 'Business Proposal'
  | 'Technical Documentation' | 'Meeting Notes' | 'Study Notes' | 'Custom';

const KINDS: DocKind[] = [
  'Research Paper', 'Project Report', 'Resume', 'Business Proposal',
  'Technical Documentation', 'Meeting Notes', 'Study Notes', 'Custom',
];

/** Built-in outline skeletons — honest templates, not fake AI output. */
const TEMPLATES: Partial<Record<DocKind, string[]>> = {
  'Research Paper': ['Abstract', 'Introduction', 'Related Work', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References'],
  'Project Report': ['Introduction', 'Problem Statement', 'Objectives', 'Methodology', 'Dataset', 'Implementation', 'Results', 'Limitations', 'Conclusion', 'References'],
  'Resume': ['Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Certifications'],
  'Business Proposal': ['Executive Summary', 'The Problem', 'Proposed Solution', 'Market Analysis', 'Pricing', 'Timeline', 'About Us'],
  'Technical Documentation': ['Overview', 'Architecture', 'Getting Started', 'API Reference', 'Configuration', 'Deployment', 'Troubleshooting', 'FAQ'],
  'Meeting Notes': ['Attendees', 'Agenda', 'Discussion', 'Decisions', 'Action Items', 'Next Meeting'],
  'Study Notes': ['Key Concepts', 'Definitions', 'Examples', 'Formulas', 'Summary', 'Practice Questions'],
};

export const GeneratorDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const ui = useUI();
  const { toast } = useToast();

  const [kind, setKind] = useState<DocKind>('Project Report');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outline, setOutline] = useState<string[] | null>(null);
  const [usedAI, setUsedAI] = useState(false);

  const generate = async () => {
    setError(null);
    setLoading(true);
    try {
      if (aiService.isConfigured && aiService.privacy === 'cloud' || aiService.configSnapshot.kind !== 'local') {
        const prompt = topic.trim()
          ? `Generate a ${kind.toLowerCase()} outline about: ${topic.trim()}`
          : `Generate a typical ${kind.toLowerCase()} outline`;
        const result = await aiService.complete([
          {
            role: 'system',
            content: 'You generate document outlines. Reply with ONLY a numbered list of 6-12 short section titles, nothing else.',
          },
          { role: 'user', content: prompt },
        ]);
        const sections = result
          .split('\n')
          .map((l) => l.replace(/^\s*\d+[.)]\s*/, '').replace(/^#+\s*/, '').trim())
          .filter((l) => l && l.length <= 80);
        if (sections.length >= 3) {
          setOutline(sections);
          setUsedAI(true);
          return;
        }
      }
      // Fallback: built-in template (honest — labeled as template)
      setOutline(TEMPLATES[kind] ?? ['Introduction', 'Main Content', 'Conclusion']);
      setUsedAI(false);
    } catch (e) {
      const message = e instanceof AIProviderError ? e.message : 'The AI request failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = () => {
    if (!outline) return;
    engine.newDocument();
    engine.setDocumentTitle(topic.trim() || `${kind}`);
    outline.forEach((section, i) => {
      if (i > 0) engine.insertParagraph();
      engine.insertText(section);
      engine.applyStyle(i === 0 ? 'Heading1' : 'Heading1');
    });
    ui.setRightPanel(null);
    toast('success', 'Document created', `${outline.length} sections ready — fill them in.`);
    onClose();
  };

  return (
    <div className="sd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sd-dialog" role="dialog" aria-modal="true" aria-label="Create with AI">
        <header className="sd-header">
          <span className="sd-header-icon"><LayoutTemplate size={15} strokeWidth={2} /></span>
          <div className="sd-title">
            Create with AI
            <div className="sd-subtitle">Generate a structure first — you fill in the content</div>
          </div>
          <button className="sd-close" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </header>

        <div className="sd-body">
          {!outline ? (
            <>
              <div className="sd-section-label">What are you creating?</div>
              <div className="gen-kinds">
                {KINDS.map((k) => (
                  <button
                    key={k}
                    className={`gen-kind${kind === k ? ' active' : ''}`}
                    onClick={() => setKind(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="sd-section-label">Topic (optional)</div>
              <input
                className="gen-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && !loading) void generate();
                }}
                placeholder={`e.g. AI-based traffic prediction for ${kind === 'Custom' ? 'my project' : `a ${kind.toLowerCase()}`}`}
                aria-label="Document topic"
              />

              {error && (
                <div className="json-message json-error" style={{ marginTop: 10 }}>
                  <AlertTriangle size={13} strokeWidth={2.2} />
                  {error}
                </div>
              )}

              <div className="sd-note" style={{ marginTop: 12 }}>
                {aiService.isConfigured && aiService.configSnapshot.kind !== 'local'
                  ? aiService.privacy === 'cloud'
                    ? <><Lock size={13} strokeWidth={2} /> Cloud provider configured — the topic text is sent to generate the outline.</>
                    : <><Sparkles size={13} strokeWidth={2} /> Local AI server configured.</>
                  : <><Lock size={13} strokeWidth={2} /> No AI provider configured — a built-in {kind} template will be used. Configure one in Settings → AI & Privacy.</>}
              </div>
            </>
          ) : (
            <>
              <div className="sd-section-label">
                Proposed structure {usedAI ? '(generated by your AI provider)' : `(built-in ${kind} template)`}
              </div>
              <div className="gen-outline">
                {outline.map((section, i) => (
                  <div key={i} className="gen-outline-row">
                    <span className="gen-outline-num">{i + 1}</span>
                    <ListTree size={12} strokeWidth={2} className="gen-outline-icon" />
                    <span className="gen-outline-text">{section}</span>
                  </div>
                ))}
              </div>
              <div className="sd-note" style={{ marginTop: 12 }}>
                <Sparkles size={13} strokeWidth={2} />
                Sections are created as Heading 1 — content stays yours. You can regenerate or edit freely.
              </div>
            </>
          )}
        </div>

        <footer className="sd-footer">
          {outline ? (
            <>
              <button className="sd-btn" onClick={() => { setOutline(null); setError(null); }}>Back</button>
              <span className="sd-footer-note" />
              <button className="sd-btn sd-btn-primary" onClick={createDocument}>
                <LayoutTemplate size={13} strokeWidth={2.2} />
                Create document
              </button>
            </>
          ) : (
            <>
              <button className="sd-btn" onClick={onClose}>Cancel</button>
              <span className="sd-footer-note" />
              <button className="sd-btn sd-btn-primary" onClick={() => void generate()} disabled={loading}>
                {loading ? <Loader2 size={13} strokeWidth={2.2} className="gen-spin" /> : <Sparkles size={13} strokeWidth={2.2} />}
                {loading ? 'Generating…' : 'Generate outline'}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};
