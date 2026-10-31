import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CalendarClock, Flag, LogOut, Menu, Moon, Search, Settings, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { useTheme } from '../context/ThemeContext';
import useClickOutside from '../hooks/useClickOutside';
import { todayStr } from '../utils/date';

function NotificationsMenu() {
  const { tasks, openModal } = useTasks();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  // Notifications are derived from real task data: overdue, due today, and untouched high-priority work.
  const items = useMemo(() => {
    const today = todayStr();
    const pending = tasks.filter((t) => t.status !== 'Done');
    const overdue = pending.filter((t) => t.date < today).map((t) => ({ task: t, text: 'Overdue', icon: AlertTriangle, tone: 'text-danger-ink' }));
    const dueToday = pending.filter((t) => t.date === today).map((t) => ({ task: t, text: 'Due today', icon: CalendarClock, tone: 'text-warning-ink' }));
    const seen = new Set([...overdue, ...dueToday].map((i) => i.task.id));
    const urgent = pending
      .filter((t) => t.priority === 'High' && t.status === 'Todo' && t.date > today && !seen.has(t.id))
      .map((t) => ({ task: t, text: 'High priority, not started', icon: Flag, tone: 'text-primary-ink' }));
    return [...overdue, ...dueToday, ...urgent];
  }, [tasks]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="icon-btn relative"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${items.length ? `, ${items.length} new` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={20} />
        {items.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-card bg-danger" />}
      </button>

      {open && (
        <div className="card fixed inset-x-4 top-[72px] z-50 animate-scale-in overflow-hidden shadow-pop sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-bold text-ink">Notifications</h2>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up. Nothing needs attention.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.slice(0, 8).map(({ task, text, icon: Icon, tone }) => (
                <li key={`${task.id}-${text}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openModal(task);
                    }}
                    className="flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-subtle"
                  >
                    <Icon size={18} className={`mt-0.5 shrink-0 ${tone}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold text-ink">{task.title}</span>
                      <span className={`text-xs font-medium ${tone}`}>{text}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const item = 'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink transition-colors hover:bg-subtle';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold uppercase on-primary transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user?.username?.[0] || '?'}
      </button>

      {open && (
        <div className="card absolute right-0 top-full z-50 mt-2 w-60 animate-scale-in p-2 shadow-pop">
          <div className="border-b border-line px-3 pb-2 pt-1">
            <p className="truncate text-sm font-bold text-ink">{user?.username}</p>
            <p className="text-xs text-muted">Demo account</p>
          </div>
          <div className="pt-1">
            <Link to="/settings" className={item} onClick={() => setOpen(false)}>
              <Settings size={18} aria-hidden="true" /> Settings
            </Link>
            <button type="button" className={item} onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              type="button"
              className={`${item} text-danger-ink`}
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut size={18} aria-hidden="true" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Topbar({ onMenu }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const search = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/tasks?q=${encodeURIComponent(q)}` : '/tasks');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-card px-3 sm:gap-3 sm:px-6 lg:px-8">
      <button type="button" className="icon-btn lg:hidden" onClick={onMenu} aria-label="Open menu" aria-controls="sidebar">
        <Menu size={22} />
      </button>

      <form onSubmit={search} role="search" className="relative min-w-0 max-w-md flex-1">
        <label htmlFor="global-search" className="sr-only">
          Search tasks
        </label>
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks..."
          className="input bg-subtle pl-10"
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="icon-btn hidden sm:inline-flex"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
