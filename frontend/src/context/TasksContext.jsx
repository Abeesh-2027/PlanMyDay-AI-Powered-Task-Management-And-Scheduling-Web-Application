import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { useToast } from './ToastContext';
import { todayStr } from '../utils/date';
import { STATUS_META } from '../utils/constants';

const TasksContext = createContext(null);

/**
 * Single source of truth for tasks and progress statistics.
 * Every mutation goes to the FastAPI backend, then progress is re-fetched so
 * the dashboard, charts and counters update automatically.
 */
export function TasksProvider({ children }) {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, task: null, defaults: null });
  const [deleting, setDeleting] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [list, stats] = await Promise.all([api.listTasks(), api.getProgress(todayStr())]);
      setTasks(list);
      setProgress(stats);
      setError(null);
    } catch (err) {
      setError(api.getErrorMessage(err, 'Could not load your tasks.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh({ silent: true });
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  /** Create (no id) or update (id) a task. Returns true on success. */
  const saveTask = useCallback(
    async (payload, id) => {
      try {
        if (id) await api.updateTask(id, payload);
        else await api.createTask(payload);
        await refresh({ silent: true });
        toast.success(id ? 'Task updated' : 'Task created');
        return true;
      } catch (err) {
        toast.error(api.getErrorMessage(err, 'Could not save the task.'));
        return false;
      }
    },
    [refresh, toast],
  );

  /** Optimistic status change; the UI updates instantly and rolls back if the server refuses. */
  const changeStatus = useCallback(
    async (id, status) => {
      setTasks((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
      try {
        await api.updateTaskStatus(id, status);
        setProgress(await api.getProgress(todayStr()));
        toast.success(`Marked as ${STATUS_META[status].label}`);
      } catch (err) {
        toast.error(api.getErrorMessage(err, 'Could not update the status.'));
        refresh({ silent: true });
      }
    },
    [refresh, toast],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await api.deleteTask(deleting.id);
      setDeleting(null);
      await refresh({ silent: true });
      toast.success('Task deleted');
    } catch (err) {
      toast.error(api.getErrorMessage(err, 'Could not delete the task.'));
    }
  }, [deleting, refresh, toast]);

  const openModal = useCallback((task = null, defaults = null) => setModal({ open: true, task, defaults }), []);
  const closeModal = useCallback(() => setModal({ open: false, task: null, defaults: null }), []);
  const requestDelete = useCallback((task) => setDeleting(task), []);
  const cancelDelete = useCallback(() => setDeleting(null), []);

  const value = useMemo(
    () => ({
      tasks, progress, loading, error, refresh, saveTask, changeStatus,
      modal, openModal, closeModal, deleting, requestDelete, cancelDelete, confirmDelete,
    }),
    [tasks, progress, loading, error, refresh, saveTask, changeStatus, modal, openModal, closeModal, deleting, requestDelete, cancelDelete, confirmDelete],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export const useTasks = () => useContext(TasksContext);
