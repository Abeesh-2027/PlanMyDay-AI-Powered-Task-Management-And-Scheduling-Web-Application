import axios from 'axios';
import { getSession } from './auth';

/** Backend base URL. On Vercel set VITE_API_URL to your Render service URL. */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

// 60s timeout: free hosting tiers can take up to a minute to wake the backend.
const http = axios.create({ baseURL: API_URL, timeout: 60000 });

// Demo auth: send the signed-in username with every request (URL-encoded so any characters are
// header-safe). Swap this for `Authorization: Bearer <token>` when real auth is added.
http.interceptors.request.use((config) => {
  const session = getSession();
  if (session) config.headers['X-Username'] = encodeURIComponent(session.username);
  return config;
});

/** Turn any axios/FastAPI error into a readable message. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection and the API URL.';
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    // FastAPI validation errors: [{ loc: ['body', 'title'], msg: '...' }]
    return detail
      .map((d) => {
        const field = (d.loc || []).slice(1).join('.');
        const msg = String(d.msg || '').replace(/^Value error, /, '');
        return field ? `${field}: ${msg}` : msg;
      })
      .join('; ');
  }
  return fallback;
}

// ---- tasks -------------------------------------------------------------------------------
export const listTasks = () => http.get('/tasks').then((r) => r.data);
export const createTask = (body) => http.post('/tasks', body).then((r) => r.data);
export const updateTask = (id, body) => http.put(`/tasks/${id}`, body).then((r) => r.data);
export const updateTaskStatus = (id, status) => http.patch(`/tasks/${id}/status`, { status }).then((r) => r.data);
export const deleteTask = (id) => http.delete(`/tasks/${id}`);

// ---- progress & AI -----------------------------------------------------------------------
/** `today` is the browser's local date (YYYY-MM-DD) so stats match the user's timezone. */
export const getProgress = (today) => http.get('/progress', { params: { date: today } }).then((r) => r.data);
export const generateSchedule = (body) => http.post('/ai/generate-schedule', body).then((r) => r.data);

/** Health check: { status, database: 'connected' | 'unavailable' }. */
export const checkHealth = () => http.get('/health').then((r) => r.data);

export default http;
