import React from 'react';
import { ClipboardPaste, X, Type, Table2, Eraser, Braces, FileText } from 'lucide-react';
import { PasteMode, PasteCandidate } from '../../features/text/smartPaste';
import './smartDialogs.css';

interface PasteOption {
  mode: PasteMode;
  label: string;
  detail: string;
  icon: React.ReactNode;
}

export const PasteOptionsDialog: React.FC<{
  candidate: PasteCandidate;
  onPick: (mode: PasteMode) => void;
  onClose: () => void;
}> = ({ candidate, onPick, onClose }) => {
  const options: PasteOption[] = [
    { mode: 'keep', label: 'Keep Formatting', detail: 'Insert as it looked at the source', icon: <FileText size={15} strokeWidth={1.9} /> },
    { mode: 'match', label: 'Match Document', detail: 'Keep structure, adopt your fonts and styles', icon: <Type size={15} strokeWidth={1.9} /> },
    { mode: 'clean', label: 'Clean Formatting', detail: 'Strip junk styles, keep headings, lists, links, tables', icon: <Eraser size={15} strokeWidth={1.9} /> },
    { mode: 'plain', label: 'Plain Text', detail: 'Text only, no formatting at all', icon: <ClipboardPaste size={15} strokeWidth={1.9} /> },
  ];
  if (candidate.looksLikeTable || candidate.looksLikeKeyValue) {
    options.splice(1, 0, {
      mode: 'table',
      label: 'Convert to Table',
      detail: candidate.looksLikeKeyValue ? 'Turn "Key: value" lines into a two-column table' : 'Turn tab-separated lines into a table',
      icon: <Table2 size={15} strokeWidth={1.9} />,
    });
  }

  return (
    <div className="sd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sd-dialog" style={{ width: 'min(480px, calc(100vw - 48px))' }} role="dialog" aria-modal="true" aria-label="Paste options">
        <header className="sd-header">
          <span className="sd-header-icon"><ClipboardPaste size={15} strokeWidth={2} /></span>
          <div className="sd-title">
            Paste options
            <div className="sd-subtitle">
              Detected: {candidate.source === 'plain' ? 'plain text' : `content from ${candidate.source}`} · {candidate.text.split(/\s+/).length.toLocaleString()} words
            </div>
          </div>
          <button className="sd-close" onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2.2} />
          </button>
        </header>

        <div className="sd-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {options.map((o) => (
            <button key={o.mode} className="paste-option" onClick={() => onPick(o.mode)}>
              <span className="paste-option-icon">{o.icon}</span>
              <span className="paste-option-body">
                <span className="paste-option-label">{o.label}</span>
                <span className="paste-option-detail">{o.detail}</span>
              </span>
            </button>
          ))}
          <div className="sd-note" style={{ marginTop: 8 }}>
            <Braces size={13} strokeWidth={2} />
            Clean Formatting removes random fonts, colors and spacing while preserving the meaning and structure.
          </div>
        </div>
      </div>
    </div>
  );
};
