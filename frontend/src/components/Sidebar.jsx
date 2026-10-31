import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Hourglass,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';

/** Fixed on desktop; a slide-in drawer (opened by the hamburger in the top bar) on tablets and phones. */
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { progress } = useTasks();
  const navigate = useNavigate();

  const items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/tasks', label: 'My Tasks', icon: ListTodo, count: progress?.total },
    { to: '/in-progress', label: 'In Progress', icon: Hourglass, count: progress?.in_progress },
    { to: '/completed', label: 'Completed', icon: CheckCircle2, count: progress?.done },
    { to: '/planner', label: 'AI Planner', icon: Sparkles },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/progress', label: 'Progress', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 animate-fade-in bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        id="sidebar"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-card transition-[transform,visibility] duration-200 ease-out lg:w-64 lg:max-w-none lg:translate-x-0 lg:visible ${
          open ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Logo size={32} />
          <button type="button" className="icon-btn -mr-2 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map(({ to, label, icon: Icon, end, count }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive ? 'bg-primary-soft text-primary-ink' : 'text-muted hover:bg-subtle hover:text-ink'
                }`
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {typeof count === 'number' && count > 0 && (
                <span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-bold text-muted">{count}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold uppercase on-primary">
              {user?.username?.[0] || '?'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{user?.username}</p>
              <p className="text-xs text-muted">Demo account</p>
            </div>
          </div>
          <button type="button" onClick={signOut} className="btn-ghost w-full justify-start">
            <LogOut size={20} aria-hidden="true" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
