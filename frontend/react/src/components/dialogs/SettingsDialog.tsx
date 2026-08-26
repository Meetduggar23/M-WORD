import React, { useEffect, useRef, useState } from 'react';
import {
  X, Sun, Moon, Monitor, Info, SlidersHorizontal, Keyboard,
  Sparkles, ShieldCheck, Target,
} from 'lucide-react';
import { useTheme, Theme } from '../../hooks/useTheme';
import { AppPrefs } from '../../services/storage';
import { aiService } from '../../features/ai/aiService';
import {
  AIContextScope, PROVIDER_PRESETS,
} from '../../features/ai/types';
import {
  FeatureFlag, loadFlags, saveFlags, DEFAULT_FLAGS,
} from '../../features/flags';
import './SettingsDialog.css';

interface SettingsDialogProps {
  prefs: AppPrefs;
  onPrefsChange: (prefs: AppPrefs) => void;
  onClose: () => void;
  initialTab?: SettingsTab;
}

type SettingsTab = 'appearance' | 'editor' | 'ai' | 'privacy' | 'shortcuts' | 'about';

const SHORTCUTS: { keys: string; action: string }[] = [
  // A
  { keys: 'Ctrl + A', action: 'Select all' },
  // B
  { keys: 'Ctrl + B', action: 'Bold' },
  // C
  { keys: 'Ctrl + C', action: 'Copy' },
  // D
  { keys: 'Ctrl + D', action: 'Font dialog' },
  // F
  { keys: 'Ctrl + F', action: 'Find' },
  // H
  { keys: 'Ctrl + H', action: 'Find and Replace' },
  // I
  { keys: 'Ctrl + I', action: 'Italic' },
  // K
  { keys: 'Ctrl + K', action: 'Insert hyperlink / Command palette' },
  // N
  { keys: 'Ctrl + N', action: 'New document' },
  // O
  { keys: 'Ctrl + O', action: 'Open document' },
  // P
  { keys: 'Ctrl + P', action: 'Print / Export PDF' },
  // S
  { keys: 'Ctrl + S', action: 'Save document' },
  { keys: 'Ctrl + Shift + S', action: 'Save As' },
  // U
  { keys: 'Ctrl + U', action: 'Underline' },
  // V
  { keys: 'Ctrl + V', action: 'Paste' },
  // X
  { keys: 'Ctrl + X', action: 'Cut' },
  // Y
  { keys: 'Ctrl + Y', action: 'Redo' },
  // Z
  { keys: 'Ctrl + Z', action: 'Undo' },
  // Special keys
  { keys: 'F11', action: 'Toggle fullscreen' },
  { keys: 'Tab', action: 'Insert tab / Increase indent' },
  { keys: 'Shift + Tab', action: 'Decrease indent' },
  { keys: 'Enter', action: 'New paragraph' },
  { keys: 'Backspace', action: 'Delete backward' },
  { keys: 'Delete', action: 'Delete forward' },
  { keys: 'Home', action: 'Go to line start' },
  { keys: 'End', action: 'Go to line end' },
  { keys: 'Ctrl + Home', action: 'Go to document start' },
  { keys: 'Ctrl + End', action: 'Go to document end' },
  { keys: 'Ctrl + ]', action: 'Increase font size' },
  { keys: 'Ctrl + [', action: 'Decrease font size' },
  { keys: 'Escape', action: 'Close dialog / Exit focus mode' },
];

const FLAG_LABELS: { id: FeatureFlag; label: string; desc: string }[] = [
  { id: 'documentBrain', label: 'Document Brain', desc: 'Index the document on-device to power Ask-Document and semantic search' },
  { id: 'semanticSearch', label: 'Semantic search', desc: 'Meaning-based search mode in the navigation pane' },
  { id: 'commandPalette', label: 'Command palette', desc: 'Ctrl+K launcher with natural-language actions' },
  { id: 'documentHealth', label: 'Document Health', desc: 'Structure, formatting and quality scoring panel' },
  { id: 'smartPaste', label: 'Smart paste', desc: 'Offer conversion options when pasting foreign content' },
  { id: 'documentTesting', label: 'Document test', desc: 'CI-style check suite for documents' },
  { id: 'developerMode', label: 'Developer tools', desc: 'Code blocks, JSON tools and markdown import/export' },
  { id: 'voiceCommands', label: 'Voice commands', desc: 'Control the editor with speech (browser support required)' },
  { id: 'writingGoals', label: 'Writing goals', desc: 'Daily word goal and focus session tracking' },
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ prefs, onPrefsChange, onClose, initialTab }) => {
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<SettingsTab>(initialTab || 'appearance');
  const dialogRef = useRef<HTMLDivElement>(null);

  /* AI provider config — local state, committed to aiService on change */
  const [aiConfig, setAiConfig] = useState(() => aiService.configSnapshot);
  const [aiStatus, setAiStatus] = useState<{ ok: boolean; detail: string } | null>(null);
  const [flags, setFlags] = useState(() => loadFlags());
  const [scope, setScope] = useState(() => aiService.getContextScope());

  const updateAiConfig = (next: Partial<typeof aiConfig>) => {
    const merged = { ...aiConfig, ...next };
    setAiConfig(merged);
    aiService.setConfig(merged);
    setAiStatus(null);
  };

  const testProvider = async () => {
    setAiStatus(null);
    const result = await aiService.check();
    setAiStatus(result);
  };

  const applyPreset = (presetId: string) => {
    const next = aiService.applyPreset(presetId);
    setAiConfig(next);
    setAiStatus(null);
  };

  const toggleFlag = (id: FeatureFlag) => {
    const next = { ...flags, [id]: !flags[id] };
    setFlags(next);
    saveFlags(next);
  };

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
    { id: 'ai', label: 'AI Provider', icon: <Sparkles size={14} strokeWidth={2} /> },
    { id: 'privacy', label: 'Privacy & Features', icon: <ShieldCheck size={14} strokeWidth={2} /> },
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

            {tab === 'ai' && (
              <>
                <div className="settings-group-label">Provider</div>
                <div className="ai-presets">
                  {PROVIDER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      className={`ai-preset${(aiConfig.kind === p.kind && (p.kind === 'local' || aiConfig.baseUrl === p.baseUrl)) ? ' active' : ''}`}
                      onClick={() => applyPreset(p.id)}
                    >
                      <span className="ai-preset-label">{p.label}</span>
                      <span className={`ai-preset-privacy${p.privacy === 'device' ? ' device' : ''}`}>
                        {p.privacy === 'device' ? 'On device' : 'Cloud'}
                      </span>
                    </button>
                  ))}
                </div>

                {aiConfig.kind !== 'local' && (
                  <>
                    <div className="settings-group-label">Server & model</div>
                    <label className="ai-field">
                      <span>Server URL</span>
                      <input
                        value={aiConfig.baseUrl}
                        onChange={(e) => updateAiConfig({ baseUrl: e.target.value })}
                        placeholder="https://api.openai.com/v1"
                        aria-label="AI server URL"
                        spellCheck={false}
                      />
                    </label>
                    <label className="ai-field">
                      <span>API key {aiConfig.kind === 'custom' && '(optional)'}</span>
                      <input
                        type="password"
                        value={aiConfig.apiKey}
                        onChange={(e) => updateAiConfig({ apiKey: e.target.value })}
                        placeholder={aiConfig.kind === 'openai' ? 'Required for OpenAI' : 'Only if your server needs one'}
                        aria-label="AI API key"
                      />
                    </label>
                    <label className="ai-field">
                      <span>Model</span>
                      <input
                        value={aiConfig.model}
                        onChange={(e) => updateAiConfig({ model: e.target.value })}
                        placeholder="gpt-4o-mini, llama3.2…"
                        aria-label="AI model"
                        spellCheck={false}
                      />
                    </label>
                  </>
                )}

                <div className="ai-status-row">
                  <button className="settings-btn-primary" style={{ height: 28 }} onClick={() => void testProvider()}>
                    Test connection
                  </button>
                  {aiStatus && (
                    <span className={`ai-status ${aiStatus.ok ? 'ok' : 'bad'}`}>
                      {aiStatus.ok ? 'Working' : 'Failed'} — {aiStatus.detail}
                    </span>
                  )}
                </div>

                <div className="settings-group-label">AI context</div>
                <p className="settings-note" style={{ marginBottom: 8 }}>
                  Control what the AI is allowed to see. Smaller scopes are faster, cheaper and more private.
                </p>
                <div className="ai-scope-row" role="radiogroup" aria-label="AI context scope">
                  {(['selection', 'paragraph', 'section', 'page', 'document'] as AIContextScope[]).map((s) => (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={scope === s}
                      className={`ai-scope${scope === s ? ' active' : ''}`}
                      onClick={() => { setScope(s); aiService.setContextScope(s); }}
                    >
                      {s === 'selection' ? 'Selected text' : s === 'paragraph' ? 'Paragraph' : s === 'section' ? 'Section' : s === 'page' ? 'Page' : 'Entire document'}
                    </button>
                  ))}
                </div>
              </>
            )}

            {tab === 'privacy' && (
              <>
                <div className="settings-group-label">Writing goal</div>
                <label className="settings-row">
                  <span>
                    <span className="settings-row-title">Daily word goal</span>
                    <span className="settings-row-desc">Shows progress in Focus Mode — tracked on this device only</span>
                  </span>
                </label>
                <div className="ai-goal-row">
                  <Target size={14} strokeWidth={2} />
                  <input
                    type="number"
                    min={0}
                    max={50000}
                    step={100}
                    value={prefs.dailyWordGoal}
                    onChange={(e) => onPrefsChange({ ...prefs, dailyWordGoal: Math.max(0, Number(e.target.value) || 0) })}
                    aria-label="Daily word goal"
                  />
                  <span className="ai-goal-unit">words / day (0 disables)</span>
                </div>

                <div className="settings-group-label">Features</div>
                {FLAG_LABELS.filter((f) => DEFAULT_FLAGS[f.id] !== undefined).map((f) => (
                  <label key={f.id} className="settings-row">
                    <span>
                      <span className="settings-row-title">{f.label}</span>
                      <span className="settings-row-desc">{f.desc}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={flags[f.id]}
                      onChange={() => toggleFlag(f.id)}
                    />
                  </label>
                ))}
              </>
            )}

            {tab === 'shortcuts' && (
              <>
                <div className="settings-group-label">Keyboard Shortcuts</div>
                <p className="settings-note" style={{ marginBottom: 12 }}>
                  All available keyboard shortcuts. Use these to work faster.
                </p>
                <div className="shortcut-list">
                  {SHORTCUTS.map((s) => (
                    <div key={s.keys} className="shortcut-row">
                      <kbd>{s.keys}</kbd>
                      <span>{s.action}</span>
                    </div>
                  ))}
                </div>
              </>
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
