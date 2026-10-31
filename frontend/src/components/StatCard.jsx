const TONES = {
  primary: 'bg-primary-soft text-primary-ink',
  accent: 'bg-accent-soft text-accent-ink',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  muted: 'bg-subtle text-muted',
};

/** Single metric. `loading` shows a placeholder instead of the value. */
export default function StatCard({ label, value, icon: Icon, tone = 'primary', hint, loading = false }) {
  return (
    <div className="card card-hover min-w-0 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-muted">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone] || TONES.muted}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <span className="mt-3 block h-9 w-16 animate-pulse rounded-lg bg-subtle" aria-label="Loading" />
      ) : (
        <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{value ?? 0}</p>
      )}
      {hint && !loading && <p className="mt-1 truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}
