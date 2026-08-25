import React, { useState, useEffect, useRef } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useUI } from '../../store/uiStore';
import './ContextMenu.css';

interface ContextMenuProps {
  onClose: () => void;
  position: { x: number; y: number };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ onClose, position }) => {
  const engine = useDocumentEngine();
  const { setRightPanel } = useUI();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showSubmenu, setShowSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menus = {
    cut: () => { navigator.clipboard?.writeText(engine.getSelectedText()); engine.deleteBackward(); onClose(); },
    copy: () => { navigator.clipboard?.writeText(engine.getSelectedText()); onClose(); },
    paste: () => { navigator.clipboard?.readText().then(t => { if (t) engine.insertText(t); }); onClose(); },
    bold: () => { engine.toggleBold(); onClose(); },
    italic: () => { engine.toggleItalic(); onClose(); },
    underline: () => { engine.toggleUnderline(); onClose(); },
    font: (family: string) => { engine.setFontFamily(family); onClose(); },
    heading: (level: string) => { engine.applyStyle(level); onClose(); },
    bullet: () => { engine.setBulletList(); onClose(); },
    numbered: () => { engine.setNumberedList(); onClose(); },
    hyperlink: () => {
      const url = prompt('Enter URL:');
      if (url) engine.insertHyperlink(url);
      onClose();
    },
    footnote: () => {
      const text = prompt('Enter footnote text:');
      if (text) engine.insertFootnote(text);
      onClose();
    },
    comment: () => {
      const text = prompt('Add a comment:');
      if (text) engine.addComment(text);
      onClose();
    },
    alignLeft: () => { engine.setAlignment('left'); onClose(); },
    alignCenter: () => { engine.setAlignment('center'); onClose(); },
    alignRight: () => { engine.setAlignment('right'); onClose(); },
    paragraphSettings: () => { onClose(); },
    selectAll: () => { engine.selectAll(); onClose(); },
  };

  // Adjust position to stay within viewport
  const adjustedX = Math.min(position.x, window.innerWidth - 240);
  const adjustedY = Math.min(position.y, window.innerHeight - 400);

  return (
    <div className="context-menu-overlay" onContextMenu={(e) => e.preventDefault()}>
      <div
        ref={menuRef}
        className="context-menu"
        style={{ left: adjustedX, top: adjustedY }}
      >
        <MenuItem icon="✂" label="Cut" shortcut="Ctrl+X" onClick={menus.cut} />
        <MenuItem icon="📋" label="Copy" shortcut="Ctrl+C" onClick={menus.copy} />
        <MenuItem icon="📄" label="Paste" shortcut="Ctrl+V" onClick={menus.paste} />
        <div className="context-divider" />

        <div className="context-submenu-item"
          onMouseEnter={() => setShowSubmenu('font')}
          onMouseLeave={() => setShowSubmenu(null)}
        >
          <span className="cm-label">Font</span>
          <span className="cm-arrow">›</span>
          {showSubmenu === 'font' && (
            <div className="context-submenu">
              {['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Calibri', 'Cambria'].map(f => (
                <MenuItem key={f} label={f} onClick={() => menus.font(f)} />
              ))}
            </div>
          )}
        </div>

        <div className="context-submenu-item"
          onMouseEnter={() => setShowSubmenu('style')}
          onMouseLeave={() => setShowSubmenu(null)}
        >
          <span className="cm-label">Paragraph Style</span>
          <span className="cm-arrow">›</span>
          {showSubmenu === 'style' && (
            <div className="context-submenu">
              <MenuItem label="Normal" onClick={() => menus.heading('Normal')} />
              <MenuItem label="Heading 1" onClick={() => menus.heading('Heading1')} />
              <MenuItem label="Heading 2" onClick={() => menus.heading('Heading2')} />
              <MenuItem label="Heading 3" onClick={() => menus.heading('Heading3')} />
              <MenuItem label="Title" onClick={() => menus.heading('Title')} />
              <MenuItem label="Subtitle" onClick={() => menus.heading('Subtitle')} />
              <MenuItem label="Quote" onClick={() => menus.heading('Quote')} />
            </div>
          )}
        </div>

        <div className="context-divider" />

        <MenuItem icon="B" label="Bold" shortcut="Ctrl+B" onClick={menus.bold} />
        <MenuItem icon="I" label="Italic" shortcut="Ctrl+I" onClick={menus.italic} />
        <MenuItem icon="U" label="Underline" shortcut="Ctrl+U" onClick={menus.underline} />

        <div className="context-divider" />

        <div className="context-submenu-item"
          onMouseEnter={() => setShowSubmenu('align')}
          onMouseLeave={() => setShowSubmenu(null)}
        >
          <span className="cm-label">Paragraph</span>
          <span className="cm-arrow">›</span>
          {showSubmenu === 'align' && (
            <div className="context-submenu">
              <MenuItem icon="≡" label="Align Left" onClick={menus.alignLeft} />
              <MenuItem icon="≡" label="Center" onClick={menus.alignCenter} />
              <MenuItem icon="≡" label="Align Right" onClick={menus.alignRight} />
              <div className="context-divider" />
              <MenuItem label="Bullet List" onClick={menus.bullet} />
              <MenuItem label="Numbered List" onClick={menus.numbered} />
              <div className="context-divider" />
              <MenuItem label="Paragraph Settings..." onClick={menus.paragraphSettings} />
            </div>
          )}
        </div>

        <div className="context-divider" />

        <MenuItem icon="🔗" label="Hyperlink..." onClick={menus.hyperlink} />
        <MenuItem icon="💬" label="Add Comment" onClick={menus.comment} />
        <MenuItem
          icon="✨"
          label="AI Rewrite"
          onClick={() => { setRightPanel('ai'); onClose(); }}
        />

        <div className="context-divider" />

        <MenuItem icon="📑" label="Select All" shortcut="Ctrl+A" onClick={menus.selectAll} />
      </div>
    </div>
  );
};

const MenuItem: React.FC<{
  icon?: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
}> = ({ icon, label, shortcut, onClick }) => (
  <button className="context-menu-item" onClick={onClick}>
    {icon && <span className="cm-icon">{icon}</span>}
    <span className="cm-label">{label}</span>
    {shortcut && <span className="cm-shortcut">{shortcut}</span>}
  </button>
);
