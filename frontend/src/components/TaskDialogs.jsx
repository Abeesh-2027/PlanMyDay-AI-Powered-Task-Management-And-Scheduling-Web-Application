import { useRef, useState, useEffect } from 'react';
import { useTasks } from '../context/TasksContext';
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from '../utils/constants';
import { todayStr } from '../utils/date';
import Modal from './Modal';
import Segmented from './Segmented';
import { Spinner } from './Feedback';

const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p, label: p, active: PRIORITY_META[p].active }));
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label, active: STATUS_META[s].active }));

function initialForm(task, defaults) {
  if (task) {
    const wholeHours = task.duration >= 60 && task.duration % 60 === 0;
    return {
      title: task.title,
      description: task.description || '',
      date: task.date,
      time: task.time,
      durationValue: wholeHours ? task.duration / 60 : task.duration,
      durationUnit: wholeHours ? 'hour' : 'min',
      priority: task.priority,
      status: task.status,
    };
  }
  return {
    title: '',
    description: '',
    date: defaults?.date || todayStr(),
    time: defaults?.time || '09:00',
    durationValue: 30,
    durationUnit: 'min',
    priority: 'Medium',
    status: 'Todo',
  };
}

const toMinutes = (form) => Math.round(Number(form.durationValue) * (form.durationUnit === 'hour' ? 60 : 1));

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Give your task a title.';
  else if (form.title.trim().length > 120) errors.title = 'Keep the title under 120 characters.';
  if (form.description.length > 1000) errors.description = 'Keep the description under 1000 characters.';
  if (!form.date) errors.date = 'Pick a date.';
  if (!form.time) errors.time = 'Pick a time.';
  const minutes = toMinutes(form);
  if (!Number.isFinite(minutes) || minutes < 5) errors.duration = 'Duration must be at least 5 minutes.';
  else if (minutes > 1440) errors.duration = 'Duration cannot exceed 24 hours.';
  return errors;
}

function TaskForm({ task, defaults, onClose }) {
  const { saveTask } = useTasks();
  const [form, setForm] = useState(() => initialForm(task, defaults));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setValue = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    const ok = await saveTask(
      {
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        duration: toMinutes(form),
        priority: form.priority,
        status: form.status,
      },
      task?.id,
    );
    setSaving(false);
    if (ok) onClose();
  };

  const err = (key) => (errors[key] ? <p className="field-error" role="alert">{errors[key]}</p> : null);

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="task-title" className="label">Title</label>
        <input
          id="task-title"
          ref={titleRef}
          className="input"
          value={form.title}
          onChange={set('title')}
          maxLength={120}
          placeholder="e.g. Prepare quarterly report"
          aria-invalid={Boolean(errors.title)}
        />
        {err('title')}
      </div>

      <div>
        <label htmlFor="task-desc" className="label">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="task-desc"
          rows={3}
          className="input resize-none"
          value={form.description}
          onChange={set('description')}
          maxLength={1000}
          placeholder="Add a few details"
          aria-invalid={Boolean(errors.description)}
        />
        {err('description')}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor="task-date" className="label">Date</label>
          <input id="task-date" type="date" className="input" value={form.date} onChange={set('date')} aria-invalid={Boolean(errors.date)} />
          {err('date')}
        </div>
        <div>
          <label htmlFor="task-time" className="label">Time</label>
          <input id="task-time" type="time" className="input" value={form.time} onChange={set('time')} aria-invalid={Boolean(errors.time)} />
          {err('time')}
        </div>
      </div>

      <div>
        <label htmlFor="task-duration" className="label">Estimated duration</label>
        <div className="flex gap-3">
          <input
            id="task-duration"
            type="number"
            inputMode="decimal"
            min="1"
            step="any"
            className="input"
            value={form.durationValue}
            onChange={set('durationValue')}
            aria-invalid={Boolean(errors.duration)}
          />
          <select aria-label="Duration unit" className="input w-32 shrink-0" value={form.durationUnit} onChange={set('durationUnit')}>
            <option value="min">minutes</option>
            <option value="hour">hours</option>
          </select>
        </div>
        {err('duration')}
      </div>

      <div>
        <span className="label">Priority</span>
        <Segmented label="Priority" options={PRIORITY_OPTIONS} value={form.priority} onChange={setValue('priority')} />
      </div>

      <div>
        <span className="label">Status</span>
        <Segmented label="Status" options={STATUS_OPTIONS} value={form.status} onChange={setValue('status')} />
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? (<><Spinner /> Saving...</>) : task ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}

function ConfirmDelete() {
  const { deleting, cancelDelete, confirmDelete } = useTasks();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    await confirmDelete();
    setBusy(false);
  };

  return (
    <Modal title="Delete this task?" size="sm" onClose={cancelDelete}>
      <p className="text-sm text-muted">
        <strong className="break-words text-ink">{deleting.title}</strong> will be permanently removed. This can&apos;t be undone.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={cancelDelete} disabled={busy}>Keep task</button>
        <button type="button" className="btn-danger" onClick={run} disabled={busy}>
          {busy ? (<><Spinner /> Deleting...</>) : 'Delete task'}
        </button>
      </div>
    </Modal>
  );
}

/** Mounted once in the layout; any page can open these through TasksContext. */
export default function TaskDialogs() {
  const { modal, closeModal, deleting } = useTasks();
  return (
    <>
      {modal.open && (
        <Modal
          title={modal.task ? 'Edit task' : 'Add a new task'}
          description={modal.task ? 'Update the details below.' : 'What do you need to get done?'}
          onClose={closeModal}
        >
          <TaskForm task={modal.task} defaults={modal.defaults} onClose={closeModal} />
        </Modal>
      )}
      {deleting && <ConfirmDelete />}
    </>
  );
}
