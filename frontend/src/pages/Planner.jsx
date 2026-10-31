import { AlertCircle, Lightbulb, Sparkles } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import PageHeader from '../components/PageHeader';
import PlannerForm from '../components/PlannerForm';
import ScheduleResult from '../components/ScheduleResult';
import { Skeleton } from '../components/Feedback';

const TIPS = [
  'High-priority and overdue tasks are placed first.',
  'Short breaks are added between tasks automatically.',
  'Tasks that do not fit are listed instead of being squeezed in.',
  'No AI key? You still get a smart priority-based plan.',
];

export default function Planner() {
  const { schedule, generating, error, generate } = useSchedule();

  return (
    <div>
      <PageHeader title="AI Planner" subtitle="Tell PlanMyDay when you're free and let AI organize your day." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section className="card p-5" aria-labelledby="plan-title">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                <Sparkles size={20} aria-hidden="true" />
              </span>
              <h2 id="plan-title" className="text-lg font-bold text-ink">Plan your day</h2>
            </div>
            <PlannerForm showDate showNotes />
          </section>

          <section className="card p-5" aria-labelledby="tips-title">
            <h2 id="tips-title" className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <Lightbulb size={16} className="text-warning" aria-hidden="true" /> How it works
            </h2>
            <ul className="space-y-2 text-sm text-muted">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card p-5 lg:col-span-2" aria-labelledby="result-title" aria-live="polite">
          <h2 id="result-title" className="mb-5 text-lg font-bold text-ink">Your schedule</h2>

          {error && !generating && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl bg-danger-soft p-3.5 text-sm text-danger-ink">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p>{error}</p>
                <button type="button" className="mt-1 font-semibold underline" onClick={() => generate({ regenerate: Boolean(schedule) })}>
                  Try again
                </button>
              </div>
            </div>
          )}

          {generating ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted">Planning your day...</p>
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : (
            <ScheduleResult schedule={schedule} />
          )}
        </section>
      </div>
    </div>
  );
}
