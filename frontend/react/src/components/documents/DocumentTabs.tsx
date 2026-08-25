import React from 'react';
import { Plus, X } from 'lucide-react';
import './DocumentTabs.css';

export interface DocTab {
  id: string;
  title: string;
  /** Serialized snapshot; null = untouched new document */
  snapshot: string | null;
  dirty: boolean;
}

interface DocumentTabsProps {
  tabs: DocTab[];
  activeTabId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

export const DocumentTabs: React.FC<DocumentTabsProps> = ({
  tabs, activeTabId, onSelect, onClose, onNew,
}) => (
  <div className="doc-tabs" role="tablist" aria-label="Open documents">
    <div className="doc-tabs-scroll">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            className={`doc-tab${active ? ' active' : ''}`}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(tab.id);
              }
            }}
            title={tab.title || 'Untitled document'}
          >
            <span className="doc-tab-title">{tab.title || 'Untitled document'}</span>
            <button
              className="doc-tab-close"
              onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                onKeyDown={(e) => e.stopPropagation()}
              aria-label={`Close ${tab.title || 'document'}`}
              title={tab.dirty ? 'Close (unsaved changes will be kept in session)' : 'Close'}
            >
              {tab.dirty ? <span className="doc-tab-dirty" /> : <X size={12} strokeWidth={2.4} />}
            </button>
          </div>
        );
      })}
      <button
        className="doc-tab-new"
        onClick={onNew}
        aria-label="New document"
        title="New document (Ctrl+N)"
      >
        <Plus size={14} strokeWidth={2.2} />
      </button>
    </div>
  </div>
);
