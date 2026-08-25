import React, { useState } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { Logo } from '../common/Logo';
import './TitleBar.css';

interface TitleBarProps {
  onToggleFileMenu: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onToggleFileMenu }) => {
  const { document: doc, saveDocument, setDocumentTitle, canUndo, canRedo, undo, redo } = useDocumentEngine();
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(doc?.metadata.title || 'Untitled Document');

  const handleTitleDoubleClick = () => {
    setIsEditing(true);
    setTitleValue(doc?.metadata.title || 'Untitled Document');
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (titleValue.trim()) {
      setDocumentTitle(titleValue.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTitleValue(doc?.metadata.title || 'Untitled Document');
    }
  };

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <button className="title-bar-menu-btn" onClick={onToggleFileMenu} title="File Menu">
          <span className="menu-icon">☰</span>
        </button>
        <div className="quick-access-toolbar">
          <button className="qat-button" onClick={saveDocument} title="Save (Ctrl+S)">
            <span className="qat-icon">💾</span>
          </button>
          <button className="qat-button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            <span className="qat-icon">↩</span>
          </button>
          <button className="qat-button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
            <span className="qat-icon">↪</span>
          </button>
        </div>
      </div>

      <div className="title-bar-center">
        <Logo size={20} className="title-logo" />
        <span className="title-brand">WORD</span>
        <span className="title-divider" />
        {isEditing ? (
          <input
            className="title-input"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
          />
        ) : (
          <span
            className="title-text"
            onDoubleClick={handleTitleDoubleClick}
            title="Double-click to rename"
          >
            {doc?.metadata.title || 'Untitled Document'}
          </span>
        )}
        <span className="title-save-status">
          {doc?.metadata.modifiedAt ? '• Saved' : ''}
        </span>
      </div>

      <div className="title-bar-right">
        <div className="title-bar-window-controls">
          <button className="window-btn minimize" title="Minimize">
            <span>─</span>
          </button>
          <button className="window-btn maximize" title="Maximize">
            <span>☐</span>
          </button>
          <button className="window-btn close" title="Close">
            <span>✕</span>
          </button>
        </div>
      </div>
    </div>
  );
};
