import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, ChevronDown, Check, CircleDashed, Search, Undo2, Redo2, Save,
  Share2, Minus, Square, X, FileText, Pencil, Download,
} from 'lucide-react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import { useToast } from '../toast/Toast';
import { Logo } from '../common/Logo';
import './TitleBar.css';

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

interface TitleBarProps {
  saveStatus: SaveStatus;
  onSave?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ saveStatus, onSave }) => {
  const { document: doc, setDocumentTitle, saveDocument, canUndo, canRedo, undo, redo } = useDocumentEngine();
  const { openDialog, focusMode } = useUI();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(doc?.metadata.title || 'Untitled Document');
  const [nameMenuOpen, setNameMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const nameMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) setTitleValue(doc?.metadata.title || 'Untitled Document');
  }, [doc?.metadata.title, isEditing]);

  useEffect(() => {
    if (!nameMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!nameMenuRef.current?.contains(e.target as Node)) setNameMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNameMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [nameMenuOpen]);

  const commitTitle = () => {
    setIsEditing(false);
    if (titleValue.trim()) {
      setDocumentTitle(titleValue.trim());
      toast('success', 'Document renamed', `Now called “${titleValue.trim()}”.`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    openDialog('find');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.href}#${encodeURIComponent(doc?.metadata.title ?? '')}`);
      toast('success', 'Share link copied', 'Anyone with this link can open the app.');
    } catch {
      toast('info', 'Sharing', 'Link sharing is ready — clipboard access was blocked.');
    }
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const statusLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'Saved';

  return (
    <div className="title-bar">
      {/* ── Left: brand, menu, document name, save status ── */}
      <div className="title-bar-left">
        <Logo size={26} className="title-logo" />
        <button
          className="tb-icon-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('word:toggle-file-menu'))}
          title="File menu"
          aria-label="Open file menu"
          data-testid="file-menu-btn"
        >
          <Menu size={16} strokeWidth={2} />
        </button>

        <div className="doc-name-wrap" ref={nameMenuRef}>
          {isEditing ? (
            <input
              className="doc-name-input"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commitTitle();
                else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setTitleValue(doc?.metadata.title || 'Untitled Document');
                }
              }}
              autoFocus
              aria-label="Document name"
            />
          ) : (
            <button
              className="doc-name"
              onClick={() => setNameMenuOpen((o) => !o)}
              title="Document options"
              aria-label={`Document: ${doc?.metadata.title || 'Untitled Document'}. Open options.`}
              aria-expanded={nameMenuOpen}
            >
              <span className="doc-name-text">{doc?.metadata.title || 'Untitled Document'}</span>
              <ChevronDown size={13} strokeWidth={2.4} className={`doc-name-caret${nameMenuOpen ? ' open' : ''}`} />
            </button>
          )}

          {nameMenuOpen && (
            <div className="doc-name-menu" role="menu" aria-label="Document options">
              <button className="dnm-item" role="menuitem" onClick={() => { setNameMenuOpen(false); setIsEditing(true); }}>
                <Pencil size={14} strokeWidth={1.9} />
                Rename
              </button>
              <button className="dnm-item" role="menuitem" onClick={() => { setNameMenuOpen(false); onSave ? onSave() : saveDocument(); }}>
                <Save size={14} strokeWidth={1.9} />
                Save
              </button>
              <button className="dnm-item" role="menuitem" onClick={() => { setNameMenuOpen(false); saveDocument(); }}>
                <Download size={14} strokeWidth={1.9} />
                Download a copy
              </button>
              <div className="dnm-sep" />
              <button className="dnm-item" role="menuitem" onClick={() => { setNameMenuOpen(false); openDialog('wordCount'); }}>
                <FileText size={14} strokeWidth={1.9} />
                Document info
              </button>
            </div>
          )}
        </div>

        <span className={`tb-save-status ${saveStatus}`} role="status" aria-live="polite">
          {saveStatus === 'saving'
            ? <CircleDashed size={13} strokeWidth={2.2} className="spin" />
            : <Check size={13} strokeWidth={2.6} />}
          {statusLabel}
        </span>
      </div>

      {/* ── Center: search ── */}
      <form className="tb-search" onSubmit={handleSearch} role="search">
        <div className="tb-search-inner">
          <Search size={14} strokeWidth={2} className="tb-search-icon" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search (Ctrl + F)"
            aria-label="Search document"
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      </form>

      {/* ── Right: actions ── */}
      <div className="title-bar-right">
        <button className="tb-icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
          <Undo2 size={16} strokeWidth={1.9} />
        </button>
        <button className="tb-icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo">
          <Redo2 size={16} strokeWidth={1.9} />
        </button>
        <button className="tb-icon-btn" onClick={() => (onSave ? onSave() : saveDocument())} title="Save (Ctrl+S)" aria-label="Save">
          <Save size={16} strokeWidth={1.9} />
        </button>

        <button className="share-pill" onClick={handleShare} title="Copy share link" aria-label="Share">
          <Share2 size={14} strokeWidth={2} />
          Share
        </button>

        <button className="profile-chip" onClick={() => openDialog('settings')} title="Account & settings" aria-label="Account and settings">
          M
        </button>

        <div className="tb-window-controls">
          <button className="win-btn" title="Minimize — use your window controls" aria-label="Minimize">
            <Minus size={14} strokeWidth={2} />
          </button>
          <button className="win-btn" onClick={toggleFullscreen} title={focusMode ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)'} aria-label="Toggle fullscreen">
            <Square size={12} strokeWidth={2} />
          </button>
          <button className="win-btn close" title="Close — close this browser tab" aria-label="Close window">
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};
