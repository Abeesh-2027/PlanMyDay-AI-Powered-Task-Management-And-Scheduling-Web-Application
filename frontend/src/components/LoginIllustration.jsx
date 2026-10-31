// Decorative planner illustration for the login page. Pure SVG shapes, solid colors only.
function Sparkle({ x, y, r, fill }) {
  const d = `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
  return <path d={d} fill={fill} />;
}

function Row({ y, tint, bar, done }) {
  return (
    <g>
      <rect x="96" y={y} width="236" height="48" rx="12" fill={tint} />
      <rect x="96" y={y} width="6" height="48" rx="3" fill={bar} />
      <rect x="116" y={y + 12} width="110" height="9" rx="4.5" fill={bar} opacity="0.85" />
      <rect x="116" y={y + 28} width="74" height="7" rx="3.5" fill={bar} opacity="0.4" />
      <circle cx="306" cy={y + 24} r="11" fill={done ? bar : '#ffffff'} stroke={bar} strokeWidth="2.5" />
      {done && <path d={`M300.5 ${y + 24}l4 4 7-8`} stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
}

export default function LoginIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="A daily schedule with tasks and a progress ring">
      {/* planner card */}
      <rect x="70" y="40" width="292" height="300" rx="22" fill="#ffffff" />
      <rect x="96" y="66" width="120" height="12" rx="6" fill="#172554" />
      <rect x="96" y="86" width="76" height="8" rx="4" fill="#cbd5e1" />
      <circle cx="326" cy="76" r="14" fill="#eff6ff" />
      <Sparkle x={326} y={76} r={8} fill="#2563eb" />
      <Row y={116} tint="#dbeafe" bar="#2563eb" done />
      <Row y={176} tint="#ede9fe" bar="#7c3aed" />
      <Row y={236} tint="#dcfce7" bar="#16a34a" done />
      <rect x="96" y="294" width="236" height="10" rx="5" fill="#e2e8f0" />
      <rect x="96" y="294" width="156" height="10" rx="5" fill="#2563eb" />

      {/* progress card */}
      <rect x="268" y="262" width="168" height="96" rx="18" fill="#ffffff" stroke="#bfdbfe" strokeWidth="2" />
      <circle cx="318" cy="310" r="26" fill="none" stroke="#e2e8f0" strokeWidth="9" />
      <circle
        cx="318"
        cy="310"
        r="26"
        fill="none"
        stroke="#16a34a"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="163.4"
        strokeDashoffset="45.7"
        transform="rotate(-90 318 310)"
      />
      <text x="318" y="315" textAnchor="middle" fontSize="13" fontWeight="800" fill="#172554">72%</text>
      <rect x="360" y="294" width="56" height="9" rx="4.5" fill="#172554" />
      <rect x="360" y="312" width="40" height="7" rx="3.5" fill="#cbd5e1" />
      <rect x="360" y="326" width="48" height="7" rx="3.5" fill="#cbd5e1" />

      {/* AI badge */}
      <circle cx="64" cy="64" r="30" fill="#7c3aed" />
      <Sparkle x={64} y={64} r={16} fill="#ffffff" />
      <Sparkle x={86} y={40} r={6} fill="#ffffff" />

      {/* floating sparkles */}
      <Sparkle x={412} y={74} r={14} fill="#16a34a" />
      <Sparkle x={440} y={118} r={7} fill="#93c5fd" />
      <Sparkle x={36} y={226} r={9} fill="#93c5fd" />
      <Sparkle x={54} y={300} r={13} fill="#16a34a" />
    </svg>
  );
}
