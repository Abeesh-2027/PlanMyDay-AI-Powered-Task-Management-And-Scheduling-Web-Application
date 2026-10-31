import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { TIME_PRESETS } from '../utils/constants';
import { toMinutes, todayStr } from '../utils/date';
import { Spinner } from './Feedback';

/** Inputs for "Generate My Day": available hours (and, on the full planner, date + notes). */
export default function PlannerForm({ showDate = false, showNotes = false }) {
  const { hours, setHours, generate, generating, schedule } = useSchedule();
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const span = toMinutes(hours.end || '') - toMinutes(hours.start || '');
    if (!hours.start || !hours.end || Number.isNaN(span) || span < 30) {
      setError('Choose a start and end time at least 30 minutes apart.');
      return;
    }
    setError('');
    await generate({ date, notes: notes.trim(), regenerate: Boolean(schedule) });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className={`grid gap-4 ${showDate ? 'sm:grid-cols-3' : 'grid-cols-2'}`}>
        {showDate && (
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="plan-date" className="label">
              Day to plan
            </label>
            <input id="plan-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        )}
        <div>
          <label htmlFor="plan-start" className="label">
            Available from
          </label>
          <input
            id="plan-start"
            type="time"
            className="input"
            value={hours.start}
            onChange={(e) => setHours({ start: e.target.value })}
            aria-invalid={Boolean(error)}
          />
        </div>
        <div>
          <label htmlFor="plan-end" className="label">
            Available until
          </label>
          <input
            id="plan-end"
            type="time"
            className="input"
            value={hours.end}
            onChange={(e) => setHours({ end: e.target.value })}
            aria-invalid={Boolean(error)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Quick time presets">
        {TIME_PRESETS.map((p) => {
          const active = hours.start === p.start && hours.end === p.end;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => setHours({ start: p.start, end: p.end })}
              aria-pressed={active}
              className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold transition-colors ${
                active ? 'border-primary bg-primary-soft text-primary-ink' : 'border-line text-muted hover:bg-subtle hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {showNotes && (
        <div>
          <label htmlFor="plan-notes" className="label">
            Anything the AI should know? <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="plan-notes"
            rows={2}
            maxLength={300}
            className="input resize-none"
            placeholder="e.g. Lunch at 1 PM, I focus best in the morning"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={generating}>
        {generating ? (
          <>
            <Spinner /> Planning your day...
          </>
        ) : schedule ? (
          <>
            <RefreshCw size={16} aria-hidden="true" /> Regenerate
          </>
        ) : (
          <>
            <Sparkles size={16} aria-hidden="true" /> Generate My Day
          </>
        )}
      </button>
    </form>
  );
}
