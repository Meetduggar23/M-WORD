import React, { useState } from 'react';
import { useDocumentEngine } from '../../hooks/useDocumentEngine';
import { useAuth } from '../../store/authStore';
import {
  Info, FilePlus, FolderOpen, Save, FileDown, Printer,
  Download, Share2, UserCircle, Settings, ArrowLeft,
  FileText, BarChart3, Mail, Newspaper, LayoutGrid,
  Megaphone, Receipt, Code2, Braces,
  Copy, Globe, Type as TypeIcon, LogOut, User,
} from 'lucide-react';
import './FileMenu.css';

interface FileMenuProps {
  onClose: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

type FileMenuTab = 'info' | 'new' | 'open' | 'save' | 'saveAs' | 'print' | 'export' | 'share' | 'account' | 'options';

const TabIcon: React.FC<{ icon: React.ReactNode; active?: boolean }> = ({ icon, active }) => (
  <span className={`file-tab-icon${active ? ' active' : ''}`}>{icon}</span>
);

export const FileMenu: React.FC<FileMenuProps> = ({ onClose, onOpenSettings, onOpenProfile, onLogout }) => {
  const engine = useDocumentEngine();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<FileMenuTab>('info');

  const tabs: { id: FileMenuTab; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Info', icon: <Info size={18} strokeWidth={1.8} /> },
    { id: 'new', label: 'New', icon: <FilePlus size={18} strokeWidth={1.8} /> },
    { id: 'open', label: 'Open', icon: <FolderOpen size={18} strokeWidth={1.8} /> },
    { id: 'save', label: 'Save', icon: <Save size={18} strokeWidth={1.8} /> },
    { id: 'saveAs', label: 'Save As', icon: <FileDown size={18} strokeWidth={1.8} /> },
    { id: 'print', label: 'Print', icon: <Printer size={18} strokeWidth={1.8} /> },
    { id: 'export', label: 'Export', icon: <Download size={18} strokeWidth={1.8} /> },
    { id: 'share', label: 'Share', icon: <Share2 size={18} strokeWidth={1.8} /> },
    { id: 'account', label: 'Account', icon: <UserCircle size={18} strokeWidth={1.8} /> },
    { id: 'options', label: 'Options', icon: <Settings size={18} strokeWidth={1.8} /> },
  ];

  const templates = [
    { name: 'Blank Document', icon: <FileText size={22} strokeWidth={1.5} />, description: 'Start with a blank page' },
    { name: 'Resume', icon: <UserCircle size={22} strokeWidth={1.5} />, description: 'Professional resume template' },
    { name: 'Report', icon: <BarChart3 size={22} strokeWidth={1.5} />, description: 'Business report template' },
    { name: 'Letter', icon: <Mail size={22} strokeWidth={1.5} />, description: 'Formal letter template' },
    { name: 'Newsletter', icon: <Newspaper size={22} strokeWidth={1.5} />, description: 'Newsletter template' },
    { name: 'Brochure', icon: <LayoutGrid size={22} strokeWidth={1.5} />, description: 'Tri-fold brochure template' },
    { name: 'Flyer', icon: <Megaphone size={22} strokeWidth={1.5} />, description: 'Marketing flyer template' },
    { name: 'Invoice', icon: <Receipt size={22} strokeWidth={1.5} />, description: 'Business invoice template' },
  ];

  const exportFormats = [
    { format: 'PDF', icon: <FileText size={18} strokeWidth={1.8} />, description: 'Open print dialog to save as PDF', extension: '.pdf' },
    { format: 'HTML', icon: <Code2 size={18} strokeWidth={1.8} />, description: 'Web Page', extension: '.html' },
    { format: 'Plain Text', icon: <TypeIcon size={18} strokeWidth={1.8} />, description: 'Plain text file', extension: '.txt' },
    { format: 'JSON', icon: <Braces size={18} strokeWidth={1.8} />, description: 'WORD native format', extension: '.json' },
  ];

  const handleNewBlank = () => { engine.newDocument(); onClose(); };
  const handleNewTemplate = (templateName: string) => { engine.newDocument(); engine.setDocumentTitle(templateName); onClose(); };
  const handleSave = () => { engine.saveDocument(); onClose(); };
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
  const handleOpen = () => { engine.openDocument(); onClose(); };
  const handlePrint = () => { window.print(); onClose(); };
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
    // Export the current document when there is no active selection. A
    // selection is still respected for users intentionally exporting only a
    // portion of the document.
    const text = engine.getSelectedText() || engine.getAllText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (engine.document?.metadata.title || 'document') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };
  const handleExportPDF = () => { handlePrint(); };

  return (
    <div className="file-menu-container">
      <div className="file-menu-sidebar">
        <div className="file-menu-sidebar-head">
          <button className="file-menu-back" onClick={onClose} aria-label="Back to editor">
            <ArrowLeft size={17} strokeWidth={2} />
            <span>Back to editor</span>
          </button>
          <div className="file-menu-logo">
            <img src="/logo2.png" alt="WORD logo" draggable={false} />
            <div>
              <span className="logo-text-large">WORD</span>
              <span className="logo-text-subtitle">Document workspace</span>
            </div>
          </div>
        </div>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`file-menu-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <TabIcon icon={tab.icon} active={activeTab === tab.id} />
            <span className="file-tab-label">{tab.label}</span>
          </button>
        ))}
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
                  <span className={`track-indicator${engine.document?.trackChanges.enabled ? ' on' : ''}`} />
                  Track Changes: {engine.document?.trackChanges.enabled ? 'ON' : 'OFF'}
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
                <div className="template-icon"><FilePlus size={28} strokeWidth={1.4} /></div>
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
                <FolderOpen size={20} strokeWidth={1.8} />
                <div>
                  <div className="open-title">Browse Files</div>
                  <div className="open-desc">Open WORD native (.word or .json) files</div>
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
            <button className="save-btn primary" onClick={handleExportHTML}>
              <Download size={20} strokeWidth={1.8} />
              <div>
                <div className="save-title">Download formatted document</div>
                <div className="save-desc">Download the latest editor changes as HTML</div>
              </div>
            </button>
            <button className="save-btn" onClick={handleSaveAsJSON}>
              <Save size={20} strokeWidth={1.8} />
              <div>
                <div className="save-title">Save editable file</div>
                <div className="save-desc">Save the complete WORD document model as JSON</div>
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
                <Save size={18} strokeWidth={1.8} />
                <div>
                  <div className="saveas-title">WORD Document (.word)</div>
                  <div className="saveas-desc">Native format with all features</div>
                </div>
              </button>
              <button className="saveas-btn" onClick={handleSaveAsJSON}>
                <Braces size={18} strokeWidth={1.8} />
                <div>
                  <div className="saveas-title">JSON Document (.json)</div>
                  <div className="saveas-desc">JSON format for web compatibility</div>
                </div>
              </button>
              <button className="saveas-btn" onClick={handleExportHTML}>
                <Code2 size={18} strokeWidth={1.8} />
                <div>
                  <div className="saveas-title">HTML Document (.html)</div>
                  <div className="saveas-desc">Web page format</div>
                </div>
              </button>
              <button className="saveas-btn" onClick={handleExportText}>
                <TypeIcon size={18} strokeWidth={1.8} />
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
                <Printer size={20} strokeWidth={1.8} />
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
                  if (fmt.format === 'PDF') handleExportPDF();
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
                  {fmt.icon}
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
              }}>
                <Copy size={18} strokeWidth={1.8} />
                <div>
                  <div className="share-title">Copy to Clipboard</div>
                  <div className="share-desc">Copy document text for pasting</div>
                </div>
              </button>
              <button className="share-btn" onClick={handleExportHTML}>
                <Globe size={18} strokeWidth={1.8} />
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
            {isAuthenticated && user ? (
              <>
                <div className="account-info">
                  <div
                    className="account-avatar"
                    style={{ background: user.color, color: '#fff' }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user.initials
                    )}
                  </div>
                  <div className="account-details">
                    <div className="account-name">{user.name}</div>
                    <div className="account-email">{user.email}</div>
                  </div>
                </div>
                <div className="account-section">
                  <h3>Account Actions</h3>
                  <button
                    className="account-action-btn"
                    onClick={() => { onOpenProfile?.(); onClose(); }}
                  >
                    <User size={16} strokeWidth={1.8} />
                    Edit Profile
                  </button>
                  <button
                    className="account-action-btn account-action-danger"
                    onClick={() => { onLogout?.(); onClose(); }}
                  >
                    <LogOut size={16} strokeWidth={1.8} />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="account-section">
                <div className="account-not-signed-in">
                  <UserCircle size={40} strokeWidth={1.4} style={{ color: 'var(--text-muted)' }} />
                  <p>You are not signed in.</p>
                  <p className="account-email">Sign in to sync your documents and personalize your experience.</p>
                </div>
              </div>
            )}
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
                    if (input?.value) engine.setTextWatermark(input.value);
                  }}>Apply</button>
                  <button className="options-btn" onClick={() => engine.removeWatermark()}>Remove</button>
                </div>
              </div>
              {onOpenSettings && (
                <div className="options-section">
                  <h3>Appearance &amp; More</h3>
                  <p className="options-info">Themes, editor preferences, and shortcuts live in the full Settings dialog.</p>
                  <button
                    className="options-btn options-btn-open-settings"
                    onClick={() => { onClose(); onOpenSettings(); }}
                  >
                    Open Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
