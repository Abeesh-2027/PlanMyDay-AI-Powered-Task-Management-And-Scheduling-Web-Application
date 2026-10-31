import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, CircleDot, Hourglass, ListTodo, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { useSchedule } from '../context/ScheduleContext';
import StatCard from '../components/StatCard';
import ProgressRing from '../components/ProgressRing';
import ProgressBar from '../components/ProgressBar';
import { StatusDonut, WeeklyChart } from '../components/Charts';
import TaskRow from '../components/TaskRow';
import PlannerForm from '../components/PlannerForm';
import ScheduleResult from '../components/ScheduleResult';
import { EmptyState, ErrorState, Skeleton } from '../components/Feedback';
import { formatDateLong, greeting, todayStr } from '../utils/date';

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, progress: p, loading, error, refresh, openModal } = useTasks();
  const { schedule, generating } = useSchedule();
  const [tab, setTab] = useState('week');

  const today = todayStr();
  const todays = useMemo(
    () => tasks.filter((t) => t.date === today).sort((a, b) => a.time.localeCompare(b.time)),
    [tasks, today],
  );

  if (error && !p) return <ErrorState message={error} onRetry={() => refresh()} />;

  const initialLoad = loading && !p;
  const tabClass = (name) =>
    `min-h-[36px] rounded-lg px-3 text-sm font-semibold transition-colors ${
      tab === name ? 'bg-card text-ink shadow-card' : 'text-muted hover:text-ink'
    }`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <CalendarDays size={16} aria-hidden="true" /> {formatDateLong(new Date())}
          </p>
          <h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {greeting()}, {user.username}!
          </h1>
          <p className="mt-1 text-muted">Welcome back. Here&apos;s what&apos;s on your plate today.</p>
        </div>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => openModal()}>
          <Plus size={18} aria-hidden="true" /> Add Task
        </button>
      </header>

      <section aria-label="Task statistics" className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tasks" value={p?.total} icon={ListTodo} tone="muted" loading={initialLoad} hint={p && `${p.today.total} scheduled today`} />
        <StatCard label="To Do" value={p?.pending} icon={CircleDot} tone="accent" loading={initialLoad} hint={p && (p.overdue ? `${p.overdue} overdue` : 'Nothing overdue')} />
        <StatCard label="In Progress" value={p?.in_progress} icon={Hourglass} tone="primary" loading={initialLoad} hint="Currently being worked on" />
        <StatCard label="Completed" value={p?.done} icon={CheckCircle2} tone="success" loading={initialLoad} hint={p && `${p.completion_percentage}% overall completion`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2" aria-labelledby="productivity-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="productivity-title" className="text-lg font-bold text-ink">Productivity</h2>
            <div role="group" aria-label="Chart range" className="flex gap-1 rounded-xl bg-subtle p-1">
              <button type="button" className={tabClass('week')} aria-pressed={tab === 'week'} onClick={() => setTab('week')}>Weekly</button>
              <button type="button" className={tabClass('today')} aria-pressed={tab === 'today'} onClick={() => setTab('today')}>Today</button>
            </div>
          </div>
          {initialLoad ? (
            <Skeleton className="h-64 w-full" />
          ) : tab === 'week' ? (
            <WeeklyChart data={p?.daily} />
          ) : (
            <div className="grid items-center gap-6 sm:grid-cols-2">
              <StatusDonut todo={p.today.todo} inProgress={p.today.in_progress} done={p.today.done} />
              <div className="space-y-4">
                <ProgressBar label="Today's completion" value={p.today.done} max={p.today.total} tone="success" valueText={`${p.today.done}/${p.today.total}`} />
                <p className="text-sm text-muted">
                  {p.today.total === 0
                    ? 'No tasks are scheduled for today yet.'
                    : `${p.today.minutes_completed} of ${p.today.minutes_planned} planned minutes completed.`}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="card flex flex-col items-center p-5 text-center" aria-labelledby="completion-title">
          <h2 id="completion-title" className="mb-4 self-start text-lg font-bold text-ink">Overall Completion</h2>
          {initialLoad ? <Skeleton className="h-36 w-36 rounded-full" /> : <ProgressRing value={p?.completion_percentage ?? 0} size={150} />}
          <p className="mt-4 text-sm text-muted">
            {p && p.total > 0 ? `${p.done} of ${p.total} tasks completed` : 'Add your first task to start tracking'}
          </p>
          <Link to="/progress" className="mt-2 text-sm font-semibold text-primary-ink hover:underline">View detailed progress</Link>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden" aria-labelledby="today-title">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 id="today-title" className="text-lg font-bold text-ink">
              Today&apos;s Tasks <span className="ml-1 text-sm font-semibold text-muted">({todays.length})</span>
            </h2>
            <Link to="/tasks" className="text-sm font-semibold text-primary-ink hover:underline">View all</Link>
          </div>
          {initialLoad ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : todays.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled for today"
              text="Add a task for today and PlanMyDay will help you fit it into your schedule."
              action={<button type="button" className="btn-primary" onClick={() => openModal()}><Plus size={16} aria-hidden="true" /> Add Task</button>}
            />
          ) : (
            <ul>{todays.map((t) => <TaskRow key={t.id} task={t} />)}</ul>
          )}
        </section>

        <section className="card p-5" aria-labelledby="ai-title">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent-ink">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 id="ai-title" className="text-lg font-bold leading-tight text-ink">AI Daily Schedule</h2>
              <p className="text-xs text-muted">Tell us when you&apos;re free. We&apos;ll plan the rest.</p>
            </div>
          </div>
          <PlannerForm />
          <div className="mt-5 border-t border-line pt-5" aria-live="polite">
            {generating ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <ScheduleResult schedule={schedule} limit={5} showStats={false} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
