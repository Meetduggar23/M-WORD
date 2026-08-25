import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { useTheme, Theme } from '../../hooks/useTheme';
import './ThemeToggle.css';

const OPTIONS: { value: Theme; label: string; hint: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', hint: 'Bright workspace', icon: <Sun size={15} strokeWidth={2} /> },
  { value: 'dark', label: 'Dark', hint: 'Low-light comfort', icon: <Moon size={15} strokeWidth={2} /> },
  { value: 'system', label: 'System', hint: 'Match OS setting', icon: <Monitor size={15} strokeWidth={2} /> },
];

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-toggle" ref={rootRef}>
      <button
        className={`tt-button${open ? ' open' : ''}`}
        onClick={toggleTheme}
        onContextMenu={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        aria-label={`Switch theme (current: ${resolvedTheme}). Right-click for all options.`}
        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme · right-click for options`}
        data-testid="theme-toggle"
      >
        <span className={`tt-icon-wrap ${resolvedTheme}`}>
          <Sun size={15} strokeWidth={2} className={`tt-sun${resolvedTheme === 'light' ? ' visible' : ''}`} />
          <Moon size={15} strokeWidth={2} className={`tt-moon${resolvedTheme === 'dark' ? ' visible' : ''}`} />
        </span>
      </button>
      <button
        className={`tt-caret${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Theme options"
        aria-expanded={open}
        title="Theme options"
      >
        <ChevronDown size={12} strokeWidth={2.4} />
      </button>

      {open && (
        <div className="theme-menu" role="menu" aria-label="Choose theme">
          <div className="theme-menu-label">Appearance</div>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="menuitemradio"
              aria-checked={theme === opt.value}
              className={`theme-menu-item${theme === opt.value ? ' selected' : ''}`}
              onClick={() => { setTheme(opt.value); setOpen(false); }}
            >
              <span className="tmi-icon">{opt.icon}</span>
              <span className="tmi-text">
                <span className="tmi-label">{opt.label}</span>
                <span className="tmi-hint">{opt.hint}</span>
              </span>
              {theme === opt.value && <Check size={14} strokeWidth={2.4} className="tmi-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
