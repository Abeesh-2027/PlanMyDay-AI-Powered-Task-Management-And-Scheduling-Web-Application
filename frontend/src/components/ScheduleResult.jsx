import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bot, Clock, ListChecks, Wand2 } from 'lucide-react';
import { Badge, PriorityBadge } from './Badges';
import ScheduleTimeline from './ScheduleTimeline';
import { EmptyState } from './Feedback';
import { formatDateShort, formatDuration } from '../utils/date';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-subtle px-3.5 py-3">
      <Icon size={18} className="shrink-0 text-primary-ink" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-xs text-muted">{label}</p>
        <p className="text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

/** Summary, timeline and unscheduled list for a generated schedule. `limit` shortens it for the dashboard. */
export default function ScheduleResult({ schedule, limit, showStats = true }) {
  if (!schedule) {
    return (
      <EmptyState
        icon={Wand2}
        title="No schedule yet"
        text="Pick your available hours and press Generate My Day. PlanMyDay will arrange your pending tasks with breaks."
      />
    );
  }

  const tasks = schedule.schedule.filter((i) => i.type === 'task');
  const focus = tasks.reduce((sum, i) => sum + i.duration, 0);
  const breaks = schedule.schedule.filter((i) => i.type === 'break').reduce((sum, i) => sum + i.duration, 0);
  const truncated = limit && schedule.schedule.length > limit;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={schedule.source === 'ai' ? 'accent' : 'muted'} icon={Bot}>
          {schedule.source === 'ai' ? `AI plan${schedule.ai_model ? ` · ${schedule.ai_model}` : ''}` : 'Priority-based plan'}
        </Badge>
        <span className="text-xs text-muted">{formatDateShort(schedule.date)}</span>
      </div>

      {schedule.warning && (
        <div role="status" className="flex items-start gap-3 rounded-xl bg-warning-soft p-3.5 text-sm text-warning-ink">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{schedule.warning}</p>
        </div>
      )}

      {schedule.summary && <p className="text-sm leading-relaxed text-muted">{schedule.summary}</p>}

      {showStats && tasks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat icon={ListChecks} label="Tasks scheduled" value={`${tasks.length} of ${tasks.length + schedule.unscheduled.length}`} />
          <Stat icon={Clock} label="Focus time" value={formatDuration(focus)} />
          <Stat icon={Clock} label="Break time" value={formatDuration(breaks)} />
        </div>
      )}

      {schedule.schedule.length > 0 && <ScheduleTimeline items={schedule.schedule} limit={limit} />}

      {truncated && (
        <Link to="/planner" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-ink hover:underline">
          View full schedule <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}

      {schedule.unscheduled.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-bold text-ink">Couldn&apos;t fit today</h4>
          <ul className="space-y-2">
            {schedule.unscheduled.map((item) => (
              <li key={item.task_id} className="rounded-xl border border-dashed border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-sm font-semibold text-ink">{item.title}</span>
                  <PriorityBadge priority={item.priority} />
                </div>
                <p className="mt-1 text-xs text-muted">{item.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
