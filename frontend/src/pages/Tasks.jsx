import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, Search, SearchX, X } from 'lucide-react';
import { useTasks } from '../context/TasksContext';
import PageHeader from '../components/PageHeader';
import TaskCard from '../components/TaskCard';
import Segmented from '../components/Segmented';
import { EmptyState, ErrorState, Skeleton } from '../components/Feedback';
import { PRIORITIES } from '../utils/constants';

const VIEWS = {
  all: { title: 'My Tasks', subtitle: 'Everything on your plate, in one place.', locked: null },
  'in-progress': { title: 'In Progress', subtitle: "Tasks you're working on right now.", locked: 'In Progress' },
  completed: { title: 'Completed', subtitle: "Nice work! Here's everything you've finished.", locked: 'Done' },
};

const RANK = { High: 0, Medium: 1, Low: 2 };
const byDeadline = (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || RANK[a.priority] - RANK[b.priority];
const byPriority = (a, b) => RANK[a.priority] - RANK[b.priority] || a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

export default function Tasks({ view = 'all' }) {
  const { title, subtitle, locked } = VIEWS[view];
  const { tasks, loading, error, refresh, openModal } = useTasks();
  const [params] = useSearchParams();

  const [q, setQ] = useState(params.get('q') || '');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [date, setDate] = useState('');
  const [sort, setSort] = useState('deadline-asc');

  // The top-bar search sends people here with ?q=...
  useEffect(() => {
    setQ(params.get('q') || '');
  }, [params]);

  const activeStatus = locked || (status === 'all' ? null : status);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = tasks.filter(
      (t) =>
        (!activeStatus || t.status === activeStatus) &&
        (priority === 'all' || t.priority === priority) &&
        (!date || t.date === date) &&
        (!needle || t.title.toLowerCase().includes(needle) || (t.description || '').toLowerCase().includes(needle)),
    );
    const [field, order] = sort.split('-');
    list.sort(field === 'priority' ? byPriority : byDeadline);
    if (order === 'desc') list.reverse();
    return list;
  }, [tasks, activeStatus, priority, date, q, sort]);

  const filtersActive = Boolean(q || date || priority !== 'all' || (!locked && status !== 'all'));
  const clearFilters = () => {
    setQ('');
    setDate('');
    setPriority('all');
    setStatus('all');
  };

  if (error && tasks.length === 0) return <ErrorState message={error} onRetry={() => refresh()} />;

  const count = (s) => tasks.filter((t) => t.status === s).length;
  const statusOptions = [
    { value: 'all', label: `All (${tasks.length})` },
    { value: 'Todo', label: `To Do (${count('Todo')})` },
    { value: 'In Progress', label: `Active (${count('In Progress')})` },
    { value: 'Done', label: `Done (${count('Done')})` },
  ];

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => openModal()}>
          <Plus size={18} aria-hidden="true" /> Add Task
        </button>
      </PageHeader>

      <div className="card mb-6 space-y-4 p-4 sm:p-5">
        {!locked && <Segmented label="Filter by status" options={statusOptions} value={status} onChange={setStatus} />}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <label htmlFor="f-search" className="sr-only">Search tasks</label>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="f-search" className="input pl-10" placeholder="Search title or description" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <label htmlFor="f-date" className="sr-only">Filter by date</label>
            <input id="f-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="f-priority" className="sr-only">Filter by priority</label>
            <select id="f-priority" className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="all">All priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p} priority</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-sort" className="sr-only">Sort tasks</label>
            <select id="f-sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="deadline-asc">Deadline: soonest first</option>
              <option value="deadline-desc">Deadline: latest first</option>
              <option value="priority-asc">Priority: high to low</option>
              <option value="priority-desc">Priority: low to high</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted" aria-live="polite">
          <span>Showing <strong className="text-ink">{filtered.length}</strong> of {tasks.length} tasks</span>
          {filtersActive && (
            <button type="button" onClick={clearFilters} className="inline-flex min-h-[36px] items-center gap-1 font-semibold text-primary-ink hover:underline">
              <X size={14} aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No tasks yet"
            text="Create your first task and let PlanMyDay help you organize your day."
            action={<button type="button" className="btn-primary" onClick={() => openModal()}><Plus size={16} aria-hidden="true" /> Add your first task</button>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={SearchX}
            title={filtersActive ? 'No tasks match your filters' : `No ${title.toLowerCase()} tasks`}
            text={filtersActive ? 'Try changing or clearing your filters.' : 'Tasks will appear here as their status changes.'}
            action={filtersActive && <button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => <TaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}
