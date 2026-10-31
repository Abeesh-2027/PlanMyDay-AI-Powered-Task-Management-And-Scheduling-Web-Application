import { CalendarDays, Clock, Hourglass, Pencil, Trash2 } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import { PRIORITY_META, STATUSES, STATUS_META } from '../utils/constants';
import { dueLabel, fmt12, formatDateShort, formatDuration } from '../utils/date';
import { PriorityBadge } from './Badges';
import Segmented from './Segmented';

const DUE_TEXT = {
  danger: 'text-danger-ink',
  warning: 'text-warning-ink',
  success: 'text-success-ink',
  primary: 'text-primary-ink',
  muted: 'text-muted',
};

const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label, active: STATUS_META[s].active }));

/** Task card: deadline, priority, status switcher, edit and delete. Used on My Tasks / In Progress / Completed. */
export default function TaskCard({ task }) {
  const { changeStatus, openModal, requestDelete } = useTasks();
  const due = dueLabel(task);
  const done = task.status === 'Done';

  return (
    <article className={`card card-hover flex min-w-0 flex-col border-l-4 p-4 sm:p-5 ${PRIORITY_META[task.priority].border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={`break-words text-base leading-snug ${done ? 'text-muted line-through' : 'text-ink'}`}>{task.title}</h3>
          <p className={`mt-1 text-xs font-semibold ${DUE_TEXT[due.tone]}`}>{due.text}</p>
        </div>
        <div className="-mr-2 -mt-2 flex shrink-0">
          <button type="button" className="icon-btn" onClick={() => openModal(task)} aria-label={`Edit ${task.title}`} title="Edit">
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn hover:bg-danger-soft hover:text-danger-ink"
            onClick={() => requestDelete(task)}
            aria-label={`Delete ${task.title}`}
            title="Delete"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {task.description && <p className="mt-2 line-clamp-2 break-words text-sm text-muted">{task.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <PriorityBadge priority={task.priority} />
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={14} aria-hidden="true" /> {formatDateShort(task.date)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={14} aria-hidden="true" /> {fmt12(task.time)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Hourglass size={14} aria-hidden="true" /> {formatDuration(task.duration)}
        </span>
      </div>

      <div className="mt-auto pt-4">
        <Segmented
          label={`Status of ${task.title}`}
          options={STATUS_OPTIONS}
          value={task.status}
          onChange={(status) => status !== task.status && changeStatus(task.id, status)}
        />
      </div>
    </article>
  );
}
