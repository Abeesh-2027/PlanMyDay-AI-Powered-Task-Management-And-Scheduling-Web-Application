import { CalendarDays, CheckCircle2, Circle, Clock, Pencil } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import { NEXT_STATUS, STATUS_META, TONES } from '../utils/constants';
import { fmt12, formatDateShort } from '../utils/date';
import { PriorityBadge } from './Badges';

/** Compact task line used on the dashboard and calendar. Tap the circle to complete, the status pill to cycle. */
export default function TaskRow({ task }) {
  const { changeStatus, openModal } = useTasks();
  const done = task.status === 'Done';
  const meta = STATUS_META[task.status];

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => changeStatus(task.id, done ? 'Todo' : 'Done')}
        aria-label={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {done ? <CheckCircle2 size={24} className="text-success" /> : <Circle size={24} />}
      </button>

      <div className="min-w-0 flex-1 basis-40">
        <p className={`break-words text-sm font-semibold ${done ? 'text-muted line-through' : 'text-ink'}`}>{task.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} aria-hidden="true" /> {formatDateShort(task.date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} aria-hidden="true" /> {fmt12(task.time)}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <button
          type="button"
          onClick={() => changeStatus(task.id, NEXT_STATUS[task.status])}
          title="Change status"
          aria-label={`${task.title} is ${meta.label}. Move to ${STATUS_META[NEXT_STATUS[task.status]].label}`}
          className={`inline-flex min-h-[32px] items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors hover:ring-2 hover:ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${TONES[meta.tone]}`}
        >
          {meta.label}
        </button>
        <button type="button" className="icon-btn" onClick={() => openModal(task)} aria-label={`Edit ${task.title}`}>
          <Pencil size={16} />
        </button>
      </div>
    </li>
  );
}
