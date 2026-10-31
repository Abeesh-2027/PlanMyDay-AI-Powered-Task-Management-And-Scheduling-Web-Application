import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut, Moon, Server, Sun, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import Segmented from '../components/Segmented';
import { Spinner } from '../components/Feedback';
import { API_URL, checkHealth } from '../services/api';

function Section({ title, description, children }) {
  return (
    <section className="card p-5">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { hours, setHours } = useSchedule();
  const navigate = useNavigate();
  const [health, setHealth] = useState({ state: 'idle' });

  const test = async () => {
    setHealth({ state: 'checking' });
    try {
      const data = await checkHealth();
      setHealth({ state: data.database === 'connected' ? 'ok' : 'degraded' });
    } catch {
      setHealth({ state: 'error' });
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Personalize PlanMyDay." />

      <div className="grid max-w-3xl gap-6">
        <Section title="Profile" description="You're using PlanMyDay in demo mode.">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold uppercase on-primary">
                {user.username[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{user.username}</p>
                <p className="text-sm text-muted">Demo account. Tasks are saved under this username.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary w-full sm:w-auto"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut size={18} aria-hidden="true" /> Logout
            </button>
          </div>
        </Section>

        <Section title="Appearance" description="Choose a light or dark interface.">
          <Segmented
            label="Theme"
            className="max-w-xs"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            {theme === 'dark' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
            Currently using the {theme} theme.
          </p>
        </Section>

        <Section title="Working hours" description="Your default availability in the AI Planner.">
          <div className="grid max-w-sm grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-start" className="label">From</label>
              <input id="set-start" type="time" className="input" value={hours.start} onChange={(e) => setHours({ start: e.target.value })} />
            </div>
            <div>
              <label htmlFor="set-end" className="label">Until</label>
              <input id="set-end" type="time" className="input" value={hours.end} onChange={(e) => setHours({ end: e.target.value })} />
            </div>
          </div>
        </Section>

        <Section title="Connection" description="Check that the app can reach its backend and database.">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={test} disabled={health.state === 'checking'}>
              {health.state === 'checking' ? <Spinner /> : <Server size={18} aria-hidden="true" />} Test connection
            </button>
            <p className="min-w-0 break-all text-xs text-muted">{API_URL}</p>
          </div>
          <div aria-live="polite" className="mt-3 text-sm font-medium">
            {health.state === 'ok' && (
              <p className="flex items-center gap-2 text-success-ink"><CheckCircle2 size={18} aria-hidden="true" /> Backend online and database connected.</p>
            )}
            {health.state === 'degraded' && (
              <p className="flex items-center gap-2 text-warning-ink"><XCircle size={18} aria-hidden="true" /> Backend is online but the database is unavailable.</p>
            )}
            {health.state === 'error' && (
              <p className="flex items-center gap-2 text-danger-ink"><XCircle size={18} aria-hidden="true" /> Can&apos;t reach the backend. If it&apos;s on a free plan it may be waking up. Try again in a minute.</p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
