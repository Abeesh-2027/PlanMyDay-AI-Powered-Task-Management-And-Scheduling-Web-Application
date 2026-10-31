// Shared labels and style tokens. Full class names are written out so Tailwind can detect them.

export const PRIORITIES = ['High', 'Medium', 'Low'];
export const STATUSES = ['Todo', 'In Progress', 'Done'];

export const TONES = {
  primary: 'bg-primary-soft text-primary-ink',
  accent: 'bg-accent-soft text-accent-ink',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
  muted: 'bg-subtle text-ink',
};

export const PRIORITY_META = {
  High: {
    tone: 'danger',
    border: 'border-l-danger',
    dot: 'bg-danger',
    active: 'bg-danger-soft text-danger-ink ring-2 ring-inset ring-danger',
  },
  Medium: {
    tone: 'warning',
    border: 'border-l-warning',
    dot: 'bg-warning',
    active: 'bg-warning-soft text-warning-ink ring-2 ring-inset ring-warning',
  },
  Low: {
    tone: 'success',
    border: 'border-l-success',
    dot: 'bg-success',
    active: 'bg-success-soft text-success-ink ring-2 ring-inset ring-success',
  },
};

export const STATUS_META = {
  Todo: {
    label: 'To Do',
    tone: 'accent',
    active: 'bg-accent-soft text-accent-ink ring-2 ring-inset ring-accent',
  },
  'In Progress': {
    label: 'In Progress',
    tone: 'primary',
    active: 'bg-primary-soft text-primary-ink ring-2 ring-inset ring-primary',
  },
  Done: {
    label: 'Done',
    tone: 'success',
    active: 'bg-success-soft text-success-ink ring-2 ring-inset ring-success',
  },
};

export const NEXT_STATUS = { Todo: 'In Progress', 'In Progress': 'Done', Done: 'Todo' };

export const TIME_PRESETS = [
  { label: '9 AM - 6 PM', start: '09:00', end: '18:00' },
  { label: '8 AM - 4 PM', start: '08:00', end: '16:00' },
  { label: '10 AM - 7 PM', start: '10:00', end: '19:00' },
];
