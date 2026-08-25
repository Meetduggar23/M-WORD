import React, { useEffect, useRef, useState } from 'react';
import { X, Sun, Moon, Monitor, Info, SlidersHorizontal, Keyboard } from 'lucide-react';
import { useTheme, Theme } from '../../hooks/useTheme';
import { AppPrefs } from '../../services/storage';
import './SettingsDialog.css';

interface SettingsDialogProps {
  prefs: AppPrefs;
  onPrefsChange: (prefs: AppPrefs) => void;
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'editor' | 'shortcuts' | 'about';

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: 'Ctrl + N', action: 'New document' },
  { keys: 'Ctrl + O', action: 'Open document' },
  { keys: 'Ctrl + S', action: 'Save' },
  { keys: 'Ctrl + P', action: 'Print / Export PDF' },
  { keys: 'Ctrl + F', action: 'Find' },
  { keys: 'Ctrl + H', action: 'Replace' },
  { keys: 'Ctrl + B / I / U', action: 'Bold · Italic · Underline' },
  { keys: 'Ctrl + K', action: 'Insert hyperlink' },
  { keys: 'Ctrl + Z / Y', action: 'Undo · Redo' },
  { keys: 'F11', action: 'Toggle fullscreen' },
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ prefs, onPrefsChange, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<SettingsTab>('appearance');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Sun size={14} strokeWidth={2} /> },
    { id: 'editor', label: 'Editor', icon: <SlidersHorizontal size={14} strokeWidth={2} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={14} strokeWidth={2} /> },
    { id: 'about', label: 'About', icon: <Info size={14} strokeWidth={2} /> },
  ];

  const themeOptions: { value: Theme; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', desc: 'Bright and crisp', icon: <Sun size={20} strokeWidth={1.8} /> },
    { value: 'dark', label: 'Dark', desc: 'Easy on the eyes', icon: <Moon size={20} strokeWidth={1.8} /> },
    { value: 'system', label: 'System', desc: 'Follows your OS', icon: <Monitor size={20} strokeWidth={1.8} /> },
  ];

  return (
    <div className="settings-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        ref={dialogRef}
        tabIndex={-1}
      >
        <aside className="settings-sidebar">
          <div className="settings-sidebar-title">Settings</div>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`settings-nav-item${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </aside>

        <div className="settings-main">
          <header className="settings-header">
            <h3>{tabs.find((t) => t.id === tab)?.label}</h3>
            <button className="settings-close" onClick={onClose} aria-label="Close settings" title="Close">
              <X size={16} strokeWidth={2.2} />
            </button>
          </header>

          <div className="settings-body">
            {tab === 'appearance' && (
              <>
                <div className="settings-group-label">Theme</div>
                <div className="theme-cards">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`theme-card${theme === opt.value ? ' selected' : ''}`}
                      onClick={() => setTheme(opt.value)}
                      role="radio"
                      aria-checked={theme === opt.value}
                    >
                      <span className="theme-card-preview" data-preview={opt.value}>
                        <span className="tcp-bar" />
                        <span className="tcp-line w70" />
                        <span className="tcp-line w50" />
                        <span className="tcp-line w60" />
                      </span>
                      <span className="theme-card-icon">{opt.icon}</span>
                      <span className="theme-card-name">{opt.label}</span>
                      <span className="theme-card-desc">{opt.desc}</span>
                      {theme === opt.value && <span className="theme-card-check">✓</span>}
                    </button>
                  ))}
                </div>
                <p className="settings-note">
                  Your choice is remembered on this device and applied instantly across the whole app.
                </p>
              </>
            )}

            {tab === 'editor' && (
              <>
                <label className="settings-row">
                  <span>
                    <span className="settings-row-title">Autosave recents</span>
                    <span className="settings-row-desc">Remember recently saved documents on this device</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={prefs.autosave}
                    onChange={(e) => onPrefsChange({ ...prefs, autosave: e.target.checked })}
                  />
                </label>
                <label className="settings-row" aria-disabled="true">
                  <span>
                    <span className="settings-row-title">
                      Spell checking
                      <span className="settings-pill">Preview build</span>
                    </span>
                    <span className="settings-row-desc">Underline potential spelling issues as you type</span>
                  </span>
                  <input type="checkbox" checked={false} disabled readOnly />
                </label>

                <div className="settings-group-label">Your name</div>
                <input
                  className="settings-text-input"
                  value={prefs.userName}
                  onChange={(e) => onPrefsChange({ ...prefs, userName: e.target.value })}
                  placeholder="Shown on the start page"
                  aria-label="Your name"
                />
              </>
            )}

            {tab === 'shortcuts' && (
              <div className="shortcut-list">
                {SHORTCUTS.map((s) => (
                  <div key={s.keys} className="shortcut-row">
                    <kbd>{s.keys}</kbd>
                    <span>{s.action}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'about' && (
              <div className="about-box">
                <div className="about-name">WORD</div>
                <div className="about-version">Version 1.0.0 · Phase 2 Preview</div>
                <p className="about-text">
                  A premium, modern word processor built with a multi-language architecture for performance,
                  security, and a smooth writing experience.
                </p>
                <div className="about-meta">Light &amp; dark themes · Local-first documents · Offline AI assistance</div>
              </div>
            )}
          </div>

          <footer className="settings-footer">
            <button className="settings-btn-primary" onClick={onClose}>Done</button>
          </footer>
        </div>
      </div>
    </div>
  );
};
