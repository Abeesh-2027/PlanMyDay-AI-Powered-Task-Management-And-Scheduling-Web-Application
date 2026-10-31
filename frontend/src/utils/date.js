// Date helpers. All dates are local "YYYY-MM-DD" strings (never toISOString, which is UTC and can be off by a day).

export const pad = (n) => String(n).padStart(2, '0');

export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => toDateStr(new Date());

export const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s, n) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

export const formatDateLong = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export const formatDateShort = (s) => parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const formatMonth = (d) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

/** "14:30" -> "2:30 PM" */
export const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const formatDuration = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** Whole days from today to the given date (negative = past). */
export const dayDiff = (s) => Math.round((parseDate(s) - parseDate(todayStr())) / 86400000);

export function dueLabel(task) {
  if (task.status === 'Done') return { text: 'Completed', tone: 'success' };
  const d = dayDiff(task.date);
  if (d < 0) return { text: `Overdue by ${-d} day${d === -1 ? '' : 's'}`, tone: 'danger' };
  if (d === 0) return { text: 'Due today', tone: 'warning' };
  if (d === 1) return { text: 'Due tomorrow', tone: 'primary' };
  return { text: `Due in ${d} days`, tone: 'muted' };
}

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};
