import { useMemo, useState } from 'react';
import { CalendarX, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import PageHeader from '../components/PageHeader';
import TaskRow from '../components/TaskRow';
import { EmptyState, ErrorState } from '../components/Feedback';
import { PRIORITY_META, TONES } from '../utils/constants';
import { formatDateLong, formatMonth, pad, parseDate, todayStr } from '../utils/date';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const { tasks, error, refresh, openModal } = useTasks();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayStr());
  const today = todayStr();

  const byDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [tasks]);

  if (error && tasks.length === 0) return <ErrorState message={error} onRetry={() => refresh()} />;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const leading = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const move = (delta) => setCursor(new Date(year, month + delta, 1));
  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(todayStr());
  };

  const selectedTasks = byDate[selected] || [];

  return (
    <div>
      <PageHeader title="Calendar" subtitle="See your tasks laid out across the month." />

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-3 sm:p-5 xl:col-span-2" aria-label="Month calendar">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">{formatMonth(cursor)}</h2>
            <div className="flex items-center gap-1">
              <button type="button" className="btn-secondary min-h-[40px] px-3" onClick={goToday}>Today</button>
              <button type="button" className="icon-btn" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft size={20} /></button>
              <button type="button" className="icon-btn" onClick={() => move(1)} aria-label="Next month"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-muted" aria-hidden="true">
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-2">
                <span className="sm:hidden">{d[0]}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {cells.map((day, index) => {
              if (!day) return <div key={`blank-${index}`} aria-hidden="true" />;
              const key = `${year}-${pad(month + 1)}-${pad(day)}`;
              const list = byDate[key] || [];
              const isToday = key === today;
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-pressed={isSelected}
                  aria-label={`${formatDateLong(parseDate(key))}, ${list.length} task${list.length === 1 ? '' : 's'}`}
                  className={`flex min-h-[56px] min-w-0 flex-col items-center rounded-xl border p-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-[96px] sm:items-stretch sm:p-2 ${
                    isSelected ? 'border-primary bg-primary-soft' : 'border-line hover:bg-subtle'
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${
                      isToday ? 'bg-primary on-primary' : 'text-ink'
                    }`}
                  >
                    {day}
                  </span>

                  <span className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden" aria-hidden="true">
                    {list.slice(0, 3).map((t) => (
                      <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${PRIORITY_META[t.priority].dot}`} />
                    ))}
                  </span>

                  <span className="mt-1 hidden min-w-0 space-y-1 sm:block" aria-hidden="true">
                    {list.slice(0, 2).map((t) => (
                      <span key={t.id} className={`block truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${TONES[PRIORITY_META[t.priority].tone]} ${t.status === 'Done' ? 'line-through opacity-60' : ''}`}>
                        {t.title}
                      </span>
                    ))}
                    {list.length > 2 && <span className="block px-1 text-[11px] font-semibold text-muted">+{list.length - 2} more</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card h-fit overflow-hidden" aria-label="Tasks for the selected day" aria-live="polite">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="min-w-0 text-base font-bold text-ink">{formatDateLong(parseDate(selected))}</h2>
            <button type="button" className="btn-primary min-h-[40px] shrink-0 px-3" onClick={() => openModal(null, { date: selected })} aria-label="Add task on this day">
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
          {selectedTasks.length === 0 ? (
            <EmptyState icon={CalendarX} title="No tasks this day" text="Tap + to add one for this date." />
          ) : (
            <ul>{selectedTasks.map((t) => <TaskRow key={t.id} task={t} />)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
