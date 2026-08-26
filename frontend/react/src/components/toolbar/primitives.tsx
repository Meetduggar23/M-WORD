import React, { useEffect, useRef, useState, useCallback, ReactNode, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import './primitives.css';

/* ============================================================
   Ribbon building blocks — Fluent-style groups, buttons, menus
   ============================================================ */

export const RibbonGroup: React.FC<{ label: string; children: ReactNode; grow?: boolean }> = ({
  label, children, grow,
}) => (
  <div className={`rb-group${grow ? ' rb-group-grow' : ''}`}>
    <div className="rb-group-body">{children}</div>
    <div className="rb-group-label">{label}</div>
  </div>
);

export const RBRow: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`rb-row${className ? ` ${className}` : ''}`}>{children}</div>
);

export const RBSep: React.FC = () => <span className="rb-sep" aria-hidden="true" />;

/* ---------- Icon button ---------- */

export interface RibButtonProps {
  icon: ReactNode;
  label?: string;
  caret?: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  shortcut?: string;
}

const fullTitle = (title: string | undefined, shortcut: string | undefined, label?: string) => {
  const base = title ?? label ?? '';
  return shortcut ? `${base} (${shortcut})` : base;
};

export const RibButton: React.FC<RibButtonProps> = ({
  icon, label, caret, active, disabled, onClick, title, shortcut,
}) => (
  <button
    className={`rib-btn${active ? ' active' : ''}${label ? ' has-label' : ''}`}
    onClick={onClick}
    disabled={disabled}
    aria-label={fullTitle(title, shortcut, label)}
    aria-pressed={active}
    title={fullTitle(title, shortcut, label)}
    type="button"
  >
    <span className="rib-btn-icon">{icon}</span>
    {label && <span className="rib-btn-label">{label}</span>}
    {caret && <ChevronDown size={11} strokeWidth={2.4} className="rib-btn-caret" />}
  </button>
);

/* ---------- Big vertical button (Paste) ---------- */

export const RibBigButton: React.FC<{
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  onCaretClick?: () => void;
  disabled?: boolean;
  title?: string;
}> = ({ icon, label, onClick, onCaretClick, disabled, title }) => (
  <div className={`rib-big${disabled ? ' disabled' : ''}`}>
    <button
      className="rib-big-main"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      type="button"
    >
      <span className="rib-big-icon">{icon}</span>
      <span className="rib-big-label">{label}</span>
    </button>
    {onCaretClick && (
      <button
        className="rib-big-caret"
        onClick={onCaretClick}
        disabled={disabled}
        title={`${label} options`}
        aria-label={`${label} options`}
        type="button"
      >
        <ChevronDown size={12} strokeWidth={2.4} />
      </button>
    )}
  </div>
);

/* ---------- Labeled row button (Cut / Copy / Find…) ---------- */

export const RibListButton: React.FC<{
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  caret?: boolean;
  title?: string;
  shortcut?: string;
  active?: boolean;
}> = ({ icon, label, onClick, disabled, caret, title, shortcut, active }) => (
  <button
    className={`rib-list-btn${active ? ' active' : ''}`}
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    title={fullTitle(title, shortcut, label)}
    aria-label={fullTitle(title, shortcut, label)}
    type="button"
  >
    <span className="rib-list-icon">{icon}</span>
    <span className="rib-list-label">{label}</span>
    {caret && <ChevronDown size={11} strokeWidth={2.4} className="rib-list-caret" />}
  </button>
);

/* ---------- Combo select (font family / size) ---------- */

export const RibCombo: React.FC<{
  value: string | number;
  options: { value: string | number; label: string; style?: CSSProperties }[];
  onChange: (value: string) => void;
  width?: number;
  title: string;
  renderValue?: ReactNode;
}> = ({ value, options, onChange, width, title, renderValue }) => (
  <span className="rib-combo" style={width ? { width } : undefined} title={title}>
    {renderValue ?? <span className="rib-combo-value">{value}</span>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={title}
    >
      {options.some((o) => String(o.value) === String(value)) ? null : (
        <option value={value}>{String(value)}</option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value} style={o.style}>{o.label}</option>
      ))}
    </select>
    <ChevronDown size={12} strokeWidth={2.4} className="rib-combo-caret" />
  </span>
);

/* ---------- Dropdown menu (Portal-based, floats outside ribbon) ---------- */

export const RibDropdown: React.FC<{
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  width?: number;
  align?: 'left' | 'right';
}> = ({ trigger, children, width = 190, align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Calculate position relative to viewport when opening
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuTop = rect.bottom + 4;
    let menuLeft = align === 'right' ? rect.right - width : rect.left;

    // Clamp to viewport so it doesn't go off-screen
    menuLeft = Math.max(8, Math.min(menuLeft, window.innerWidth - width - 8));
    const menuTopClamped = Math.min(menuTop, window.innerHeight - 340);

    setPos({ top: Math.max(0, menuTopClamped), left: menuLeft });
  }, [open, width, align]);

  // Click outside + Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    // Also reposition on scroll/resize
    const onReposition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos((prev) => ({
          ...prev,
          left: Math.max(8, Math.min(
            align === 'right' ? rect.right - width : rect.left,
            window.innerWidth - width - 8,
          )),
        }));
      }
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open, width, align]);

  return (
    <div className="rib-dd">
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className={`rib-dd-trigger${open ? ' open' : ''}`}
      >
        {trigger}
      </span>
      {open && createPortal(
        <div
          ref={menuRef}
          className="rib-dd-menu"
          role="menu"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width,
            zIndex: 9000,
          }}
        >
          {children(close)}
        </div>,
        document.body,
      )}
    </div>
  );
};

export const MenuItemRow: React.FC<{
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  swatch?: string;
  shortcut?: string;
}> = ({ icon, label, onClick, selected, disabled, swatch, shortcut }) => (
  <button
    className={`rib-menu-item${selected ? ' selected' : ''}`}
    onClick={onClick}
    disabled={disabled}
    role="menuitem"
    type="button"
  >
    {swatch ? <span className="rib-menu-swatch" style={{ background: swatch }} /> : icon && (
      <span className="rib-menu-icon">{icon}</span>
    )}
    <span className="rib-menu-label">{label}</span>
    {shortcut && <span className="rib-menu-shortcut">{shortcut}</span>}
    {selected && <span className="rib-menu-check">✓</span>}
  </button>
);

/* ---------- Color palette ---------- */

const PALETTE_COLORS = [
  '#000000', '#404040', '#7f7f7f', '#bfbfbf', '#ffffff',
  '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050',
  '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0',
];

export const ColorPalette: React.FC<{
  onPick: (color: string) => void;
  allowAutomatic?: boolean;
  automaticLabel?: string;
}> = ({ onPick, allowAutomatic, automaticLabel = 'Automatic' }) => (
  <div className="rib-color-palette">
    {allowAutomatic && (
      <button
        className="rib-color-auto"
        onClick={() => onPick('')}
        type="button"
      >
        <span className="rib-color-swatch automatic" />
        {automaticLabel}
      </button>
    )}
    <div className="rib-color-grid">
      {PALETTE_COLORS.map((c) => (
        <button
          key={c}
          className="rib-color-swatch"
          style={{ background: c }}
          onClick={() => onPick(c)}
          title={c}
          aria-label={`Color ${c}`}
          type="button"
        />
      ))}
    </div>
    <label className="rib-color-custom">
      Custom color…
      <input
        type="color"
        onInput={(e) => onPick((e.target as HTMLInputElement).value)}
      />
    </label>
  </div>
);
