import React, { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import './Toast.css';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (kind: ToastKind, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_ICON: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={17} strokeWidth={2} />,
  error: <XCircle size={17} strokeWidth={2} />,
  info: <Info size={17} strokeWidth={2} />,
  warning: <AlertTriangle size={17} strokeWidth={2} />,
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    // Play leave animation first, then remove
    setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id));
    }, 200);
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback((kind: ToastKind, title: string, description?: string) => {
    const id = nextId.current++;
    setItems((list) => [...list.slice(-3), { id, kind, title, description }]);
    const timer = window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3600);
    timers.current.set(id, timer);
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Notifications" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            className={`toast toast-${item.kind}${item.leaving ? ' toast-leaving' : ''}`}
            role="status"
          >
            <span className={`toast-icon toast-icon-${item.kind}`}>{KIND_ICON[item.kind]}</span>
            <div className="toast-body">
              <div className="toast-title">{item.title}</div>
              {item.description && <div className="toast-description">{item.description}</div>}
            </div>
            <button
              className="toast-close"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
            >
              <X size={13} strokeWidth={2.4} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
