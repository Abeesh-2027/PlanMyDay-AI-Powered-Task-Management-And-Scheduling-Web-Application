/** Consistent page title block with an optional action button area. */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-3">{children}</div>}
    </header>
  );
}
