// Recharts takes plain color strings, so chart colors are resolved per theme here (solid colors only).
export function chartColors(theme) {
  if (theme === 'dark') {
    return {
      primary: '#3b82f6',
      accent: '#8b5cf6',
      success: '#22c55e',
      warning: '#f97316',
      danger: '#ef4444',
      slate: '#94a3b8',
      grid: '#25324d',
      axis: '#94a3b8',
      text: '#e2e8f0',
      tooltipBg: '#131c31',
      cursor: '#1b2740',
    };
  }
  return {
    primary: '#2563eb',
    accent: '#7c3aed',
    success: '#16a34a',
    warning: '#ea580c',
    danger: '#dc2626',
    slate: '#64748b',
    grid: '#e2e8f0',
    axis: '#64748b',
    text: '#1e293b',
    tooltipBg: '#ffffff',
    cursor: '#f1f5f9',
  };
}
