import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { todayStr } from '../utils/date';

const ScheduleContext = createContext(null);
const HOURS_KEY = 'planmyday_hours';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore blocked storage
  }
}

/** Holds the latest generated schedule and the user's working hours (both persisted locally). */
export function ScheduleProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const scheduleKey = `planmyday_schedule_${user?.username || 'guest'}`;

  const [hours, setHoursState] = useState(() => readJson(HOURS_KEY, { start: '09:00', end: '18:00' }));
  const [schedule, setSchedule] = useState(() => readJson(scheduleKey, null));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    writeJson(HOURS_KEY, hours);
  }, [hours]);

  const setHours = useCallback((next) => setHoursState((prev) => ({ ...prev, ...next })), []);

  const generate = useCallback(
    async ({ date, notes, regenerate = false } = {}) => {
      setGenerating(true);
      setError(null);
      try {
        const data = await api.generateSchedule({
          date: date || todayStr(),
          start_time: hours.start,
          end_time: hours.end,
          notes: notes || undefined,
          regenerate,
        });
        setSchedule(data);
        writeJson(scheduleKey, data);
        if (data.schedule.length === 0) toast.info(data.summary);
        else if (data.source === 'ai') toast.success('Your day is planned!');
        else toast.info(data.warning || 'Schedule created.');
        return data;
      } catch (err) {
        const message = api.getErrorMessage(err, 'Could not generate your schedule.');
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [hours, scheduleKey, toast],
  );

  const value = useMemo(
    () => ({ schedule, hours, setHours, generating, error, generate }),
    [schedule, hours, setHours, generating, error, generate],
  );
  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export const useSchedule = () => useContext(ScheduleContext);
