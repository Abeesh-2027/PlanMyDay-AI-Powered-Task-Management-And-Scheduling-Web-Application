import { Flag } from 'lucide-react';
import { PRIORITY_META, STATUS_META, TONES } from '../utils/constants';

export function Badge({ tone = 'muted', icon: Icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <Badge tone={PRIORITY_META[priority].tone} icon={Flag}>
      {priority}
    </Badge>
  );
}

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Badge>;
}
