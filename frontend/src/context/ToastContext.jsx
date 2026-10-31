import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, bar: 'border-l-success', color: 'text-success' },
  error: { icon: AlertCircle, bar: 'border-l-danger', color: 'text-danger' },
  info: { icon: Info, bar: 'border-l-primary', color: 'text-primary' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const remove = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => remove(id), type === 'error' ? 6500 : 4000);
    },
    [remove],
  );

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-4">
        {toasts.map((t) => {
          const s = STYLES[t.type];
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex w-full animate-slide-up items-start gap-3 rounded-xl border border-l-4 border-line bg-card p-3.5 shadow-pop sm:w-[380px] ${s.bar}`}
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${s.color}`} aria-hidden="true" />
              <p className="min-w-0 flex-1 break-words text-sm font-medium text-ink">{t.message}</p>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
                className="-m-1 rounded-lg p-1 text-muted hover:bg-subtle hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
