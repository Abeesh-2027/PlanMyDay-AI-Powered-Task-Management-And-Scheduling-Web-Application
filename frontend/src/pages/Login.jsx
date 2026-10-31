import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import Logo from '../components/Logo';
import LoginIllustration from '../components/LoginIllustration';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const FEATURES = [
  'AI-built daily schedules around your priorities',
  'Smart task tracking with deadlines and progress',
  'Clean, fast and works great on every device',
];

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    try {
      const session = login(form.username, form.password);
      toast.success(`Welcome, ${session.username}! Let's plan your day.`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid min-h-screen bg-card lg:grid-cols-2">
      <main className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <button
          type="button"
          onClick={toggleTheme}
          className="icon-btn absolute right-4 top-4"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="mx-auto w-full max-w-md animate-slide-up">
          <Logo size={44} />
          <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-muted">Sign in to plan your day, track your tasks and get more done.</p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="username" className="label">Username</label>
              <input
                id="username"
                className="input"
                autoComplete="username"
                autoCapitalize="none"
                placeholder="Enter Your Name"
                value={form.username}
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value });
                  setError('');
                }}
                aria-invalid={Boolean(error)}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-12"
                  autoComplete="current-password"
                  placeholder="Enter Your Password"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setError('');
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <p id="login-error" role="alert" className="field-error">
                  {error}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full">Sign in</button>
          </form>

          <p className="mt-6 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-ink">
            <strong>Demo mode:</strong> enter any username and password to continue. Your tasks are saved under that username.
          </p>
          <p className="mt-8 text-center text-sm font-semibold text-muted">Plan Smart. Work Better. Achieve More.</p>
        </div>
      </main>

      <aside className="hidden flex-col items-center justify-center bg-navy px-12 py-12 text-white lg:flex" aria-hidden="true">
        <LoginIllustration className="w-full max-w-lg" />
        <h2 className="mt-8 max-w-md text-center text-3xl font-extrabold tracking-tight">Let AI plan your perfect day</h2>
        <ul className="mt-6 space-y-3 text-sm text-blue-100">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-white">
                <Check size={14} strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
