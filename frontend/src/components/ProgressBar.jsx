const FILL = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export default function ProgressBar({ value = 0, max = 100, tone = 'primary', label, valueText }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div>
      {(label || valueText) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-ink">{label}</span>
          <span className="text-muted">{valueText ?? `${pct}%`}</span>
        </div>
      )}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${FILL[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
