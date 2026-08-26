import React, { useMemo } from 'react';
import { BarChart3, X, Clock, FileText, Table2, Image as ImageIcon, Link2, ListTree, Gauge, Type } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { analyzeText, readingTimeMinutes } from '../../features/intel/readability';
import { collectParagraphs } from '../../features/intel/designInspector';
import './smartDialogs.css';

export const AnalyticsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const engine = useDocumentEngine();

  const stats = useMemo(() => {
    const paras = engine.document ? collectParagraphs(engine.document) : [];
    const fullText = engine.getAllText();
    const textStats = analyzeText(fullText);

    const headings = paras.filter((p) => /^Heading\d$/.test(p.style ?? '') || p.style === 'Title').length;
    const tables = engine.document?.sections.flatMap((s) => s.blocks).filter((b) => b.type === 'table').length ?? 0;
    const images = engine.document?.sections.flatMap((s) => s.blocks).filter((b) => b.type === 'image').length ?? 0;
    const links = paras.flatMap((p) => p.textRuns).filter((r) => r.hyperlink).length;
    const listItems = paras.filter((p) => p.formatting.listFormat.type !== 'none').length;

    // Longest paragraphs bar data (top 6)
    const longest = paras
      .filter((p) => (p.style ?? 'Normal') === 'Normal')
      .map((p) => ({ id: p.id, words: p.textRuns.map((r) => r.text).join('').trim().split(/\s+/).filter(Boolean).length }))
      .filter((x) => x.words > 0)
      .sort((a, b) => b.words - a.words)
      .slice(0, 6);

    return { ...textStats, headings, tables, images, links, listItems, longest };
  }, [engine]);

  const minutes = readingTimeMinutes(stats.words);

  const stat = (icon: React.ReactNode, label: string, value: string) => (
    <div key={label} className="ana-stat">
      <span className="ana-stat-icon">{icon}</span>
      <span className="ana-stat-value">{value}</span>
      <span className="ana-stat-label">{label}</span>
    </div>
  );

  return (
    <div className="sd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sd-dialog" role="dialog" aria-modal="true" aria-label="Document analytics">
        <header className="sd-header">
          <span className="sd-header-icon"><BarChart3 size={15} strokeWidth={2} /></span>
          <div className="sd-title">
            Document analytics
            <div className="sd-subtitle">Computed on this device — nothing is uploaded</div>
          </div>
          <button className="sd-close" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </header>

        <div className="sd-body">
          <div className="ana-grid">
            {stat(<FileText size={14} strokeWidth={2} />, 'Words', stats.words.toLocaleString())}
            {stat(<Type size={14} strokeWidth={2} />, 'Characters', engine.getCharacterCount().toLocaleString())}
            {stat(<FileText size={14} strokeWidth={2} />, 'Pages', String(Math.max(1, Math.ceil(stats.words / 320))))}
            {stat(<Clock size={14} strokeWidth={2} />, 'Reading time', `${minutes} min`)}
            {stat(<ListTree size={14} strokeWidth={2} />, 'Headings', String(stats.headings))}
            {stat(<Table2 size={14} strokeWidth={2} />, 'Tables', String(stats.tables))}
            {stat(<ImageIcon size={14} strokeWidth={2} />, 'Images', String(stats.images))}
            {stat(<Link2 size={14} strokeWidth={2} />, 'Links', String(stats.links))}
          </div>

          <div className="sd-section-label">Readability</div>
          <div className="ana-readability">
            <div className="ana-read-score">
              <Gauge size={16} strokeWidth={2} />
              <span>{stats.readingScore}/100</span>
            </div>
            <div className="ana-read-bar">
              <div className="ana-read-fill" style={{ width: `${stats.readingScore}%` }} />
            </div>
            <span className="ana-read-label">
              {stats.readingScore >= 70 ? 'Easy to read' : stats.readingScore >= 50 ? 'Moderately difficult' : 'Difficult'} · Flesch {stats.fleschReadingEase} · ~{stats.avgWordsPerSentence} words/sentence
            </span>
          </div>

          {stats.longest.length > 0 && (
            <>
              <div className="sd-section-label">Longest paragraphs</div>
              <div className="ana-bars">
                {stats.longest.map((p) => (
                  <button
                    key={p.id}
                    className="ana-bar-row"
                    onClick={() => {
                      requestAnimationFrame(() => {
                        document.querySelector(`[data-block-id="${p.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      });
                    }}
                    title="Jump to paragraph"
                  >
                    <div className="ana-bar-track">
                      <div className="ana-bar-fill" style={{ width: `${Math.min(100, (p.words / Math.max(1, stats.longest[0].words)) * 100)}%` }} />
                    </div>
                    <span className="ana-bar-value">{p.words}w</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <footer className="sd-footer">
          <span className="sd-footer-note">Aim for a readability score above 60 for general audiences.</span>
          <button className="sd-btn sd-btn-primary" onClick={onClose}>Done</button>
        </footer>
      </div>
    </div>
  );
};
