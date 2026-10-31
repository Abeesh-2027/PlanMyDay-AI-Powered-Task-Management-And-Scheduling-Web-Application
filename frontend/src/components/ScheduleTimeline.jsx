import { Coffee, Flag } from 'lucide-react';
import { PRIORITY_META } from '../utils/constants';
import { fmt12, formatDuration } from '../utils/date';

/** Vertical timeline of tasks and breaks. Stacks cleanly down to 320px wide screens. */
export default function ScheduleTimeline({ items = [], limit }) {
  const list = limit ? items.slice(0, limit) : items;

  return (
    <ol className="space-y-1">
      {list.map((item, index) => {
        const isBreak = item.type === 'break';
        const meta = !isBreak ? PRIORITY_META[item.priority] : null;
        return (
          <li key={`${item.start_time}-${index}`} className="flex gap-3 sm:gap-4">
            <div className="w-[68px] shrink-0 pt-3 text-right sm:w-24">
              <p className="text-xs font-bold text-ink sm:text-sm">{fmt12(item.start_time)}</p>
              <p className="text-[11px] text-muted sm:text-xs">{fmt12(item.end_time)}</p>
            </div>

            <div className="flex flex-col items-center" aria-hidden="true">
              <span className={`mt-4 h-3 w-3 shrink-0 rounded-full ring-4 ring-card ${isBreak ? 'bg-line' : meta.dot}`} />
              {index < list.length - 1 && <span className="mt-1 w-0.5 flex-1 bg-line" />}
            </div>

            <div className="min-w-0 flex-1 pb-3">
              {isBreak ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3.5 py-2.5 text-sm text-muted">
                  <Coffee size={16} aria-hidden="true" />
                  <span className="font-medium">Break</span>
                  <span className="text-xs">&middot; {formatDuration(item.duration)}</span>
                </div>
              ) : (
                <div className={`rounded-xl border border-l-4 border-line bg-card p-3.5 shadow-card ${meta.border}`}>
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <h4 className="min-w-0 break-words text-sm font-bold text-ink sm:text-base">{item.title}</h4>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted">
                      <Flag size={12} aria-hidden="true" /> {item.priority} &middot; {formatDuration(item.duration)}
                    </span>
                  </div>
                  {item.reason && (
                    <p className="mt-1.5 text-sm text-muted">
                      <span className="font-semibold text-ink">Why: </span>
                      {item.reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
