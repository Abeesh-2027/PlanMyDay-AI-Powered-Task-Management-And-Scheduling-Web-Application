import { CheckCircle2, CircleDot, Clock, Hourglass, ListTodo, Plus, Target, Timer } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import PageHeader from '../components/PageHeader';
import ProgressRing from '../components/ProgressRing';
import ProgressBar from '../components/ProgressBar';
import StatCard from '../components/StatCard';
import { FocusChart, StatusDonut, WeeklyChart } from '../components/Charts';
import { ErrorState, Skeleton } from '../components/Feedback';
import { formatDuration } from '../utils/date';

const PRIORITY_TONE = { High: 'danger', Medium: 'warning', Low: 'success' };

export default function Progress() {
  const { progress: p, loading, error, refresh, openModal } = useTasks();

  if (error && !p) return <ErrorState message={error} onRetry={() => refresh()} />;
  if (loading && !p) {
    return (
      <div>
        <PageHeader title="Progress" subtitle="Track how much you're getting done." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="mt-6 h-72" />
      </div>
    );
  }

  const t = p.today;

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" subtitle="Track how much you're getting done. Updates automatically as you work.">
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => openModal()}>
          <Plus size={18} aria-hidden="true" /> Add Task
        </button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card flex flex-col items-center p-5 text-center" aria-labelledby="overall-title">
          <h2 id="overall-title" className="mb-4 self-start text-lg font-bold text-ink">Overall Completion</h2>
          <ProgressRing value={p.completion_percentage} size={160} />
          <p className="mt-4 text-sm text-muted">{p.done} of {p.total} tasks completed</p>
        </section>

        <section className="card p-5 lg:col-span-2" aria-labelledby="status-title">
          <h2 id="status-title" className="mb-4 text-lg font-bold text-ink">Task Breakdown</h2>
          <div className="grid gap-4 min-[480px]:grid-cols-2">
            <StatCard label="Total" value={p.total} icon={ListTodo} tone="muted" />
            <StatCard label="Pending" value={p.pending} icon={CircleDot} tone="accent" />
            <StatCard label="In Progress" value={p.in_progress} icon={Hourglass} tone="primary" />
            <StatCard label="Completed" value={p.done} icon={CheckCircle2} tone="success" />
          </div>
        </section>
      </div>

      <section className="card p-5" aria-labelledby="today-stats-title">
        <h2 id="today-stats-title" className="mb-4 text-lg font-bold text-ink">Today&apos;s Productivity</h2>
        <div className="grid gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tasks today" value={t.total} icon={Target} tone="primary" />
          <StatCard label="Completed today" value={`${t.done}/${t.total}`} icon={CheckCircle2} tone="success" />
          <StatCard label="Focus time done" value={formatDuration(t.minutes_completed)} icon={Timer} tone="accent" />
          <StatCard label="Time planned" value={formatDuration(t.minutes_planned)} icon={Clock} tone="warning" />
        </div>
        <div className="mt-5">
          <ProgressBar label="Today's completion rate" value={t.done} max={t.total} tone="success" valueText={`${t.completion_percentage}%`} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="week-title">
          <h2 id="week-title" className="mb-4 text-lg font-bold text-ink">Weekly Productivity</h2>
          <WeeklyChart data={p.daily} />
        </section>
        <section className="card p-5" aria-labelledby="focus-title">
          <h2 id="focus-title" className="mb-4 text-lg font-bold text-ink">Daily Focus Time</h2>
          <FocusChart data={p.daily} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="donut-title">
          <h2 id="donut-title" className="mb-4 text-lg font-bold text-ink">Tasks by Status</h2>
          <StatusDonut todo={p.pending} inProgress={p.in_progress} done={p.done} />
        </section>
        <section className="card p-5" aria-labelledby="priority-title">
          <h2 id="priority-title" className="mb-4 text-lg font-bold text-ink">Completion by Priority</h2>
          <div className="space-y-5">
            {Object.entries(p.by_priority).map(([level, s]) => (
              <ProgressBar key={level} label={`${level} priority`} value={s.done} max={s.total} tone={PRIORITY_TONE[level]} valueText={`${s.done}/${s.total} done`} />
            ))}
          </div>
          {p.overdue > 0 && (
            <p className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-ink">
              {p.overdue} overdue task{p.overdue === 1 ? '' : 's'} need{p.overdue === 1 ? 's' : ''} your attention.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
