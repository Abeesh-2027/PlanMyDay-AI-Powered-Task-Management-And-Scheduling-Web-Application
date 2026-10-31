import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export function Spinner({ size = 18, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-subtle ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary-ink">
          <Icon size={26} aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 border-danger p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-soft text-danger-ink">
        <AlertTriangle size={24} aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-bold text-ink">We couldn&apos;t load your data</h3>
        <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
        <p className="mt-1 max-w-md text-xs text-muted">
          If the backend is hosted on a free plan it may be waking up. This can take up to a minute.
        </p>
      </div>
      {onRetry && (
        <button type="button" className="btn-primary" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}
