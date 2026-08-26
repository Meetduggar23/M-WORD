import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ListTree, Search, X, SearchX, Bookmark, MessageSquare, History, Paperclip } from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { Paragraph } from '../../engine/DocumentEngine';
import { useUI, NavView } from '../../store/uiStore';
import { useDocumentBrain } from '../../features/brain/DocumentBrainProvider';
import { semanticSearch, SearchHit } from '../../features/brain/indexer';
import './NavigationPane.css';

interface NavigationPaneProps {
  onClose: () => void;
}

const WORDS_PER_PAGE = 320;

const VIEW_TITLES: Record<NavView, string> = {
  outline: 'Document Outline',
  pages: 'Pages',
  search: 'Search',
  bookmarks: 'Bookmarks',
  comments: 'Comments',
  history: 'Version History',
  attachments: 'Attachments',
};

export const NavigationPane: React.FC<NavigationPaneProps> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const { navView: view } = useUI();
  const { index } = useDocumentBrain();
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
  const [searchMode, setSearchMode] = useState<'exact' | 'semantic'>('exact');
  const runSearch = useCallback(() => {
    setCommittedQuery(searchQuery.trim());
  }, [searchQuery]);

  // Voice / palette can request a semantic jump directly
  useEffect(() => {
    const onSemantic = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      if (!q) return;
      setSearchMode('semantic');
      setSearchQuery(q);
      setCommittedQuery(q);
    };
    window.addEventListener('word:semantic-search', onSemantic);
    return () => window.removeEventListener('word:semantic-search', onSemantic);
  }, []);

  let results: ReturnType<typeof engine.findText> = [];
  if (committedQuery && searchMode === 'exact') {
    try {
      results = engine.findText(committedQuery).slice(0, 50);
    } catch {
      results = [];
    }
  }

  const semanticHits = useMemo(() => {
    if (!committedQuery || searchMode !== 'semantic') return [];
    return semanticSearch(index, committedQuery, 10);
  }, [committedQuery, searchMode, index]);

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

  return (
    <div className="navigation-pane">
      <div className="navigation-header">
        <span className="navigation-title">{VIEW_TITLES[view ?? 'outline']}</span>
        <button className="close-button" onClick={onClose} title="Close panel" aria-label="Close navigation pane">
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div className="navigation-content">
        {/* ─── Outline ─── */}
        {view === 'outline' && (
          <>
            {headings.length === 0 ? (
              <div className="nav-empty">
                <ListTree size={26} strokeWidth={1.5} />
                <div className="nav-empty-title">No document outline</div>
                <div className="nav-empty-hint">
                  Headings you add to the document will appear here.
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
        {view === 'pages' && (
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
        )}

        {/* ─── Search ─── */}
        {view === 'search' && (
          <div className="results-panel">
            <div className="search-box">
              <Search size={14} strokeWidth={2} className="search-glyph" />
              <input
                type="text"
                placeholder={searchMode === 'semantic' ? 'Describe what you are looking for…' : 'Search document…'}
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

            <div className="search-mode" role="radiogroup" aria-label="Search mode">
              <button
                className={`search-mode-btn${searchMode === 'exact' ? ' active' : ''}`}
                role="radio"
                aria-checked={searchMode === 'exact'}
                onClick={() => setSearchMode('exact')}
                title="Find exact words"
              >
                Exact
              </button>
              <button
                className={`search-mode-btn${searchMode === 'semantic' ? ' active' : ''}`}
                role="radio"
                aria-checked={searchMode === 'semantic'}
                onClick={() => setSearchMode('semantic')}
                title="Find passages by meaning (on-device index)"
              >
                Semantic
              </button>
            </div>

            {!committedQuery && (
              <div className="nav-empty">
                <Search size={24} strokeWidth={1.6} />
                <div className="nav-empty-title">Search your document</div>
                <div className="nav-empty-hint">
                  {searchMode === 'semantic'
                    ? 'Describe a topic — e.g. “road congestion problems”. Matches by meaning, not just words.'
                    : 'Type above and press Enter to find matches.'}
                </div>
              </div>
            )}

            {committedQuery && searchMode === 'exact' && results.length === 0 && (
              <div className="nav-empty">
                <SearchX size={24} strokeWidth={1.6} />
                <div className="nav-empty-title">No results</div>
                <div className="nav-empty-hint">Nothing matched “{committedQuery}”. Try Semantic mode to search by meaning.</div>
              </div>
            )}

            {committedQuery && searchMode === 'exact' && results.length > 0 && (
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

            {committedQuery && searchMode === 'semantic' && semanticHits.length === 0 && (
              <div className="nav-empty">
                <SearchX size={24} strokeWidth={1.6} />
                <div className="nav-empty-title">No related passages</div>
                <div className="nav-empty-hint">Nothing in the document relates to “{committedQuery}”.</div>
              </div>
            )}

            {committedQuery && searchMode === 'semantic' && semanticHits.length > 0 && (
              <>
                <div className="results-count">
                  {semanticHits.length} related passage{semanticHits.length === 1 ? '' : 's'}
                </div>
                <div className="results-list">
                  {semanticHits.map((hit: SearchHit, i) => (
                    <button
                      key={`${hit.chunk.blockId}-${i}`}
                      className="result-item semantic-hit"
                      onClick={() => scrollToBlock(hit.chunk.blockId)}
                      title={`Relevance ${Math.round(hit.score * 100)}% — jump to passage`}
                    >
                      <span className="result-heading">{hit.chunk.heading}</span>
                      <span className="result-page">Page {hit.chunk.page}</span>
                      <span className="result-snippet">{hit.chunk.text.slice(0, 110)}</span>
                      <span className="result-score" style={{ width: `${Math.min(100, Math.round(hit.score * 140))}%` }} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Bookmarks ─── */}
        {view === 'bookmarks' && (
          <>
            {(engine.document?.bookmarks.length ?? 0) === 0 ? (
              <div className="nav-empty">
                <Bookmark size={26} strokeWidth={1.5} />
                <div className="nav-empty-title">No bookmarks yet</div>
                <div className="nav-empty-hint">
                  Use Insert → Bookmark to mark places you want to jump back to.
                </div>
              </div>
            ) : (
              <div className="headings-list" role="list">
                {engine.document!.bookmarks.map((bm) => (
                  <button key={bm.id} role="listitem" className="heading-item level-1" title={`Bookmark: ${bm.name}`}>
                    <span className="heading-text">{bm.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Comments ─── */}
        {view === 'comments' && (
          <>
            {(engine.comments.length ?? 0) === 0 ? (
              <div className="nav-empty">
                <MessageSquare size={26} strokeWidth={1.5} />
                <div className="nav-empty-title">No comments</div>
                <div className="nav-empty-hint">
                  Comments from Review → New Comment will appear here.
                </div>
              </div>
            ) : (
              <div className="comments-list">
                {engine.comments.map((c) => (
                  <div key={c.id} className="comment-card">
                    <div className="comment-meta">
                      <span className="comment-author">{c.author}</span>
                      {c.resolved && <span className="comment-resolved">Resolved</span>}
                    </div>
                    <div className="comment-body">{c.text}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Version history ─── */}
        {view === 'history' && (
          <div className="nav-empty">
            <History size={26} strokeWidth={1.5} />
            <div className="nav-empty-title">No prior versions</div>
            <div className="nav-empty-hint">
              Snapshots saved with autosave will appear here.
            </div>
          </div>
        )}

        {/* ─── Attachments ─── */}
        {view === 'attachments' && (
          <div className="nav-empty">
            <Paperclip size={26} strokeWidth={1.5} />
            <div className="nav-empty-title">No attachments</div>
            <div className="nav-empty-hint">
              Files linked to this document will be listed here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
