import React, { useState, useCallback } from 'react';
import { ListTree, FileText, Search, X, SearchX } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { Paragraph } from '../../engine/DocumentEngine';
import './NavigationPane.css';

interface NavigationPaneProps {
  onClose: () => void;
}

type NavigationTab = 'outline' | 'pages' | 'search';

const WORDS_PER_PAGE = 320;

export const NavigationPane: React.FC<NavigationPaneProps> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const [activeTab, setActiveTab] = useState<NavigationTab>('outline');
  const [searchQuery, setSearchQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');

  // ─── Document outline ─────────────────────────────────────────────────────
  // Computed per render: the engine mutates its document in place, so a
  // useMemo keyed on the document reference would go stale while typing.
  const headings: { id: string; level: number; text: string }[] = [];
  for (const section of engine.document?.sections ?? []) {
    for (const block of section.blocks) {
      if (block.type !== 'paragraph') continue;
      const para = block as Paragraph;
      if (!para.style?.startsWith('Heading')) continue;
      const text = para.textRuns.map((r) => r.text).join('').trim();
      if (!text) continue;
      headings.push({ id: para.id, level: parseInt(para.style.replace('Heading', ''), 10) || 1, text });
    }
  }

  const scrollToBlock = useCallback((blockId: string) => {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-block-id="${blockId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // ─── Page estimate ─────────────────────────────────────────────────────────
  const pageCount = Math.max(1, Math.ceil(engine.getWordCount() / WORDS_PER_PAGE));

  const goToPage = useCallback(
    (page: number) => {
      const wrapper = document.querySelector('.document-canvas-wrapper');
      if (!wrapper) return;
      const ratio = pageCount > 1 ? (page - 1) / (pageCount - 1) : 0;
      wrapper.scrollTo({ top: ratio * (wrapper.scrollHeight - wrapper.clientHeight), behavior: 'smooth' });
    },
    [pageCount],
  );

  // ─── Search ────────────────────────────────────────────────────────────────
  const runSearch = useCallback(() => {
    setCommittedQuery(searchQuery.trim());
  }, [searchQuery]);

  let results: ReturnType<typeof engine.findText> = [];
  if (committedQuery) {
    try {
      results = engine.findText(committedQuery).slice(0, 50);
    } catch {
      results = [];
    }
  }

  /** Short context snippet by locating the paragraph of a result. */
  const snippetFor = useCallback(
    (blockId: string): string => {
      for (const section of engine.document?.sections ?? []) {
        const block = section.blocks.find((b) => b.id === blockId);
        if (block && block.type === 'paragraph') {
          return (block as Paragraph).textRuns.map((r) => r.text).join('').slice(0, 90);
        }
      }
      return '';
    },
    [engine.document],
  );

  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'outline', label: 'Outline', icon: <ListTree size={15} strokeWidth={2} /> },
    { id: 'pages', label: 'Pages', icon: <FileText size={15} strokeWidth={2} /> },
    { id: 'search', label: 'Search', icon: <Search size={15} strokeWidth={2} /> },
  ];

  return (
    <div className="navigation-pane">
      <div className="navigation-header">
        <div className="navigation-tabs" role="tablist" aria-label="Navigation sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`navigation-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
            </button>
          ))}
        </div>
        <button className="close-button" onClick={onClose} title="Close panel" aria-label="Close navigation pane">
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div className="navigation-content">
        {/* ─── Outline ─── */}
        {activeTab === 'outline' && (
          <>
            <div className="nav-section-label">Document Outline</div>
            {headings.length === 0 ? (
              <div className="nav-empty">
                <ListTree size={24} strokeWidth={1.6} />
                <div className="nav-empty-title">No document outline</div>
                <div className="nav-empty-hint">
                  Headings will appear here when you add them to your document.
                </div>
              </div>
            ) : (
              <div className="headings-list" role="list">
                {headings.map((heading) => (
                  <button
                    key={heading.id}
                    role="listitem"
                    className={`heading-item level-${heading.level}`}
                    onClick={() => scrollToBlock(heading.id)}
                    title={`Go to "${heading.text}"`}
                  >
                    <span className="heading-text">{heading.text}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Pages ─── */}
        {activeTab === 'pages' && (
          <>
            <div className="nav-section-label">Pages</div>
            <div className="pages-list">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className="page-thumbnail"
                  onClick={() => goToPage(page)}
                  title={`Go to page ${page}`}
                >
                  <span className="page-preview">{page}</span>
                  <span className="page-number">Page {page}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Search ─── */}
        {activeTab === 'search' && (
          <div className="results-panel">
            <div className="search-box">
              <Search size={14} strokeWidth={2} className="search-glyph" />
              <input
                type="text"
                placeholder="Search document…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') runSearch();
                }}
                className="search-input"
                aria-label="Search in document"
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => { setSearchQuery(''); setCommittedQuery(''); }} aria-label="Clear search">
                  <X size={12} strokeWidth={2.4} />
                </button>
              )}
            </div>

            {!committedQuery && (
              <div className="nav-empty">
                <Search size={24} strokeWidth={1.6} />
                <div className="nav-empty-title">Search your document</div>
                <div className="nav-empty-hint">Type above and press Enter to find matches.</div>
              </div>
            )}

            {committedQuery && results.length === 0 && (
              <div className="nav-empty">
                <SearchX size={24} strokeWidth={1.6} />
                <div className="nav-empty-title">No results</div>
                <div className="nav-empty-hint">Nothing matched “{committedQuery}”. Try a different term.</div>
              </div>
            )}

            {results.length > 0 && (
              <>
                <div className="results-count">
                  {results.length} result{results.length === 1 ? '' : 's'} for “{committedQuery}”
                </div>
                <div className="results-list">
                  {results.map((pos, i) => (
                    <button
                      key={`${pos.blockId}-${i}`}
                      className="result-item"
                      onClick={() => {
                        engine.setSelection(pos, pos);
                        scrollToBlock(pos.blockId);
                      }}
                      title="Jump to match"
                    >
                      <span className="result-snippet">{snippetFor(pos.blockId) || '(match)'}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
