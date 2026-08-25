import React, { useState } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { Logo } from '../common/Logo';
import './FileMenu.css';

interface FileMenuProps {
  onClose: () => void;
}

type FileMenuTab = 'info' | 'new' | 'open' | 'save' | 'saveAs' | 'print' | 'export' | 'share' | 'account' | 'options';

export const FileMenu: React.FC<FileMenuProps> = ({ onClose }) => {
  const engine = useDocumentEngine();
  const [activeTab, setActiveTab] = useState<FileMenuTab>('info');

  const tabs: { id: FileMenuTab; label: string; icon: string }[] = [
    { id: 'info', label: 'Info', icon: 'ℹ' },
    { id: 'new', label: 'New', icon: '📄' },
    { id: 'open', label: 'Open', icon: '📂' },
    { id: 'save', label: 'Save', icon: '💾' },
    { id: 'saveAs', label: 'Save As', icon: '📋' },
    { id: 'print', label: 'Print', icon: '🖨' },
    { id: 'export', label: 'Export', icon: '📤' },
    { id: 'share', label: 'Share', icon: '🔗' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'options', label: 'Options', icon: '⚙' },
  ];

  const templates = [
    { name: 'Blank Document', icon: '📄', description: 'Start with a blank page' },
    { name: 'Resume', icon: '📋', description: 'Professional resume template' },
    { name: 'Report', icon: '📊', description: 'Business report template' },
    { name: 'Letter', icon: '✉', description: 'Formal letter template' },
    { name: 'Newsletter', icon: '📰', description: 'Newsletter template' },
    { name: 'Brochure', icon: '📑', description: 'Tri-fold brochure template' },
    { name: 'Flyer', icon: '🎯', description: 'Marketing flyer template' },
    { name: 'Invoice', icon: '🧾', description: 'Business invoice template' },
  ];

  const exportFormats = [
    { format: 'PDF', icon: '📕', description: 'Adobe Acrobat Document', extension: '.pdf' },
    { format: 'HTML', icon: '🌐', description: 'Web Page', extension: '.html' },
    { format: 'Plain Text', icon: '📝', description: 'Plain text file', extension: '.txt' },
    { format: 'JSON', icon: '📋', description: 'WORD native format', extension: '.json' },
    { format: 'RTF', icon: '📄', description: 'Rich Text Format', extension: '.rtf' },
    { format: 'Word Document', icon: '📘', description: 'Microsoft Word format', extension: '.docx' },
  ];

  const handleNewBlank = () => {
    engine.newDocument();
    onClose();
  };

  const handleNewTemplate = (templateName: string) => {
    engine.newDocument();
    engine.setDocumentTitle(templateName);
    onClose();
  };

  const handleSave = () => {
    engine.saveDocument();
    onClose();
  };

  const handleSaveAsJSON = () => {
    const json = engine.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (engine.document?.metadata.title || 'document') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleOpen = () => {
    engine.openDocument();
    onClose();
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  const handleExportHTML = () => {
    const html = engine.exportAsHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (engine.document?.metadata.title || 'document') + '.html';
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportText = () => {
    const text = engine.getSelectedText() || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (engine.document?.metadata.title || 'document') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportPDF = () => {
    // Simple PDF export via print
    handlePrint();
  };

  return (
    <div className="file-menu-overlay" onClick={onClose}>
      <div className="file-menu" onClick={(e) => e.stopPropagation()}>
        <div className="file-menu-sidebar">
          <div className="file-menu-logo">
            <Logo size={26} className="logo-mark" />
            <span className="logo-text-large">WORD</span>
          </div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`file-menu-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="file-tab-icon">{tab.icon}</span>
              <span className="file-tab-label">{tab.label}</span>
            </button>
          ))}
          <div className="file-menu-spacer" />
          <button className="file-menu-tab back" onClick={onClose}>
            <span className="file-tab-icon">←</span>
            <span className="file-tab-label">Back</span>
          </button>
        </div>

        <div className="file-menu-content">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="file-info-panel">
              <h2>Document Information</h2>
              <div className="info-section">
                <h3>Properties</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Title:</span>
                    <span className="info-value">{engine.document?.metadata.title || 'Untitled'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Author:</span>
                    <span className="info-value">{engine.document?.metadata.author || 'Unknown'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{engine.document?.metadata.createdAt ? new Date(engine.document.metadata.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Modified:</span>
                    <span className="info-value">{engine.document?.metadata.modifiedAt ? new Date(engine.document.metadata.modifiedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Words:</span>
                    <span className="info-value">{engine.getWordCount()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Characters:</span>
                    <span className="info-value">{engine.getCharacterCount()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Pages:</span>
                    <span className="info-value">~{Math.max(1, Math.ceil(engine.getWordCount() / 250))}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Paragraphs:</span>
                    <span className="info-value">{engine.getParagraphCount()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Subject:</span>
                    <span className="info-value">{engine.document?.metadata.subject || ''}</span>
                  </div>
                </div>
              </div>
              <div className="info-section">
                <h3>Manage Document</h3>
                <div className="info-actions">
                  <button className="info-action-btn" onClick={() => engine.toggleTrackChanges()}>
                    {engine.document?.trackChanges.enabled ? '🔴 Track Changes: ON' : '⚪ Track Changes: OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Tab */}
          {activeTab === 'new' && (
            <div className="file-new-panel">
              <h2>New Document</h2>
              <div className="templates-grid">
                <div className="template-card blank" onClick={handleNewBlank}>
                  <div className="template-icon">📄</div>
                  <div className="template-name">Blank Document</div>
                  <div className="template-desc">Start from scratch</div>
                </div>
                {templates.map((t, i) => (
                  <div key={i} className="template-card" onClick={() => handleNewTemplate(t.name)}>
                    <div className="template-icon">{t.icon}</div>
                    <div className="template-name">{t.name}</div>
                    <div className="template-desc">{t.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open Tab */}
          {activeTab === 'open' && (
            <div className="file-open-panel">
              <h2>Open Document</h2>
              <div className="open-options">
                <button className="open-btn primary" onClick={handleOpen}>
                  <span className="open-icon">📂</span>
                  <div>
                    <div className="open-title">Browse Files</div>
                    <div className="open-desc">Open .word, .json, or .txt files</div>
                  </div>
                </button>
                <div className="recent-files">
                  <h3>Recent Documents</h3>
                  <div className="no-recent">No recent documents</div>
                </div>
              </div>
            </div>
          )}

          {/* Save Tab */}
          {activeTab === 'save' && (
            <div className="file-save-panel">
              <h2>Save Document</h2>
              <div className="save-options">
                <button className="save-btn primary" onClick={handleSave}>
                  <span className="save-icon">💾</span>
                  <div>
                    <div className="save-title">Save to Disk</div>
                    <div className="save-desc">Save as .word file</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Save As Tab */}
          {activeTab === 'saveAs' && (
            <div className="file-saveas-panel">
              <h2>Save As</h2>
              <div className="saveas-options">
                <button className="saveas-btn" onClick={handleSave}>
                  <span className="saveas-icon">💾</span>
                  <div>
                    <div className="saveas-title">WORD Document (.word)</div>
                    <div className="saveas-desc">Native format with all features</div>
                  </div>
                </button>
                <button className="saveas-btn" onClick={handleSaveAsJSON}>
                  <span className="saveas-icon">📋</span>
                  <div>
                    <div className="saveas-title">JSON Document (.json)</div>
                    <div className="saveas-desc">JSON format for web compatibility</div>
                  </div>
                </button>
                <button className="saveas-btn" onClick={handleExportHTML}>
                  <span className="saveas-icon">🌐</span>
                  <div>
                    <div className="saveas-title">HTML Document (.html)</div>
                    <div className="saveas-desc">Web page format</div>
                  </div>
                </button>
                <button className="saveas-btn" onClick={handleExportText}>
                  <span className="saveas-icon">📝</span>
                  <div>
                    <div className="saveas-title">Plain Text (.txt)</div>
                    <div className="saveas-desc">Text only, no formatting</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Print Tab */}
          {activeTab === 'print' && (
            <div className="file-print-panel">
              <h2>Print</h2>
              <div className="print-options">
                <button className="print-btn primary" onClick={handlePrint}>
                  <span className="print-icon">🖨</span>
                  <div>
                    <div className="print-title">Print</div>
                    <div className="print-desc">Print the current document</div>
                  </div>
                </button>
                <div className="print-preview-area">
                  <div className="print-preview-page">
                    <div className="print-preview-title">{engine.document?.metadata.title || 'Untitled'}</div>
                    <div className="print-preview-text">
                      {engine.getAllText().substring(0, 500)}...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="file-export-panel">
              <h2>Export</h2>
              <div className="export-options">
                {exportFormats.map((fmt, i) => (
                  <button key={i} className="export-btn" onClick={() => {
                    if (fmt.format === 'PDF' || fmt.format === 'Word Document') handleExportPDF();
                    else if (fmt.format === 'HTML') handleExportHTML();
                    else if (fmt.format === 'Plain Text') handleExportText();
                    else if (fmt.format === 'JSON') handleSaveAsJSON();
                    else {
                      const text = engine.getAllText();
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = (engine.document?.metadata.title || 'document') + fmt.extension;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                    onClose();
                  }}>
                    <span className="export-icon">{fmt.icon}</span>
                    <div>
                      <div className="export-title">{fmt.format}</div>
                      <div className="export-desc">{fmt.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="file-share-panel">
              <h2>Share</h2>
              <div className="share-options">
                <div className="share-info">Share your document with others</div>
                <button className="share-btn" onClick={() => {
                  navigator.clipboard?.writeText(engine.getAllText());
                  alert('Document text copied to clipboard!');
                }}>
                  <span className="share-icon">📋</span>
                  <div>
                    <div className="share-title">Copy to Clipboard</div>
                    <div className="share-desc">Copy document text for pasting</div>
                  </div>
                </button>
                <button className="share-btn" onClick={handleExportHTML}>
                  <span className="share-icon">🌐</span>
                  <div>
                    <div className="share-title">Export as HTML</div>
                    <div className="share-desc">Create a shareable web page</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="file-account-panel">
              <h2>Account</h2>
              <div className="account-info">
                <div className="account-avatar">U</div>
                <div className="account-details">
                  <div className="account-name">{engine.document?.metadata.author || 'User'}</div>
                  <div className="account-email">WORD Editor User</div>
                </div>
              </div>
              <div className="account-section">
                <h3>User Information</h3>
                <div className="account-field">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={engine.document?.metadata.author || ''}
                    onChange={(e) => engine.setDocumentAuthor(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="account-field">
                  <label>Subject:</label>
                  <input
                    type="text"
                    value={engine.document?.metadata.subject || ''}
                    onChange={(e) => engine.setDocumentSubject(e.target.value)}
                    placeholder="Document subject"
                  />
                </div>
                <div className="account-field">
                  <label>Keywords:</label>
                  <input
                    type="text"
                    value={engine.document?.metadata.keywords || ''}
                    onChange={(e) => engine.setDocumentKeywords(e.target.value)}
                    placeholder="Document keywords"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Options Tab */}
          {activeTab === 'options' && (
            <div className="file-options-panel">
              <h2>Options</h2>
              <div className="options-sections">
                <div className="options-section">
                  <h3>Track Changes</h3>
                  <label className="options-toggle">
                    <input
                      type="checkbox"
                      checked={engine.document?.trackChanges.enabled || false}
                      onChange={() => engine.toggleTrackChanges()}
                    />
                    <span>Enable Track Changes</span>
                  </label>
                </div>
                <div className="options-section">
                  <h3>Auto-Correct</h3>
                  <p className="options-info">AutoCorrect is enabled with {engine.autoCorrectEntries.length} entries.</p>
                </div>
                <div className="options-section">
                  <h3>Spelling</h3>
                  <p className="options-info">Language: English (United States)</p>
                </div>
                <div className="options-section">
                  <h3>Watermark</h3>
                  <div className="options-row">
                    <input
                      type="text"
                      placeholder="Watermark text..."
                      id="watermark-input"
                      className="options-input"
                    />
                    <button className="options-btn" onClick={() => {
                      const input = document.getElementById('watermark-input') as HTMLInputElement;
                      if (input?.value) {
                        engine.setTextWatermark(input.value);
                      }
                    }}>Apply</button>
                    <button className="options-btn" onClick={() => engine.removeWatermark()}>Remove</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
