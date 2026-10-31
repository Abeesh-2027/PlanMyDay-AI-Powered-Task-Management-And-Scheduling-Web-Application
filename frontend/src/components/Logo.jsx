// PlanMyDay logo: calendar + check mark + AI sparkles, redrawn as SVG so it stays sharp at any size
// and follows the light/dark theme. Solid colors only.
export function LogoMark({ size = 36, className = '' }) {
  const blue = { fill: 'var(--logo-blue)' };
  const blueStroke = { stroke: 'var(--logo-blue)' };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="15" y="3" width="6" height="12" rx="3" style={blue} />
      <rect x="41" y="3" width="6" height="12" rx="3" style={blue} />
      <rect x="5" y="9" width="52" height="50" rx="12" style={blue} />
      <rect x="11" y="23" width="40" height="30" rx="4" fill="#ffffff" />
      <path d="M11 33H51M11 43H51M24 23V53M38 23V53" style={blueStroke} strokeWidth="3" fill="none" />
      <path d="M30 23Q30 30 37 30Q30 30 30 37Q30 30 23 30Q30 30 30 23Z" fill="#16a34a" />
      <path d="M21 24Q21 27 24 27Q21 27 21 30Q21 27 18 27Q21 27 21 24Z" fill="#16a34a" />
      <path d="M37 22.2Q37 25 39.8 25Q37 25 37 27.8Q37 25 34.2 25Q37 25 37 22.2Z" fill="#16a34a" />
      <path d="M24 37L32 45L55 13" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 37L32 45L55 13" style={blueStroke} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function Logo({ size = 36, showText = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && <span className="text-xl font-extrabold tracking-tight text-ink">PlanMyDay</span>}
    </span>
  );
}
