/** Touch-friendly segmented control. Each option may carry its own `active` class string. */
export default function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div role="group" aria-label={label} className={`flex w-full gap-1 rounded-xl bg-subtle p-1 ${className}`}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-[40px] flex-1 rounded-lg px-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm ${
              selected ? option.active || 'bg-card text-ink shadow-card' : 'text-muted hover:bg-card hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
