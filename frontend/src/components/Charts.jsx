import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { chartColors } from '../utils/chartColors';

function useChart() {
  const { theme } = useTheme();
  const c = chartColors(theme);
  return {
    c,
    tick: { fill: c.axis, fontSize: 12 },
    tooltip: {
      contentStyle: {
        background: c.tooltipBg,
        border: `1px solid ${c.grid}`,
        borderRadius: 12,
        color: c.text,
        fontSize: 12,
        boxShadow: 'none',
      },
      labelStyle: { color: c.text, fontWeight: 700 },
      cursor: { fill: c.cursor },
    },
  };
}

function Legend({ items }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function NoData({ children }) {
  return <div className="grid h-64 place-items-center px-4 text-center text-sm text-muted">{children}</div>;
}

/** Planned vs completed tasks for the last 7 days. */
export function WeeklyChart({ data = [] }) {
  const { c, tick, tooltip } = useChart();
  if (!data.some((d) => d.total > 0)) return <NoData>No tasks were scheduled in the last 7 days.</NoData>;
  return (
    <div>
      <Legend items={[{ label: 'Planned', color: c.accent }, { label: 'Completed', color: c.primary }]} />
      <div className="mt-3 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
            <Tooltip {...tooltip} />
            <Bar dataKey="total" name="Planned" fill={c.accent} radius={[6, 6, 0, 0]} maxBarSize={22} />
            <Bar dataKey="done" name="Completed" fill={c.primary} radius={[6, 6, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Minutes of completed work per day. */
export function FocusChart({ data = [] }) {
  const { c, tick, tooltip } = useChart();
  if (!data.some((d) => d.minutes_done > 0)) return <NoData>Complete a task to see your focus time here.</NoData>;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} unit="m" />
          <Tooltip {...tooltip} formatter={(v) => [`${v} min`, 'Focus time']} />
          <Line
            type="monotone"
            dataKey="minutes_done"
            name="Focus time"
            stroke={c.success}
            strokeWidth={3}
            dot={{ r: 4, fill: c.success, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut of tasks by status. */
export function StatusDonut({ todo = 0, inProgress = 0, done = 0 }) {
  const { c, tooltip } = useChart();
  const total = todo + inProgress + done;
  const items = [
    { label: 'To Do', value: todo, color: c.accent },
    { label: 'In Progress', value: inProgress, color: c.primary },
    { label: 'Done', value: done, color: c.success },
  ];
  const data = total ? items.filter((i) => i.value > 0) : [{ label: 'No tasks', value: 1, color: c.grid }];

  return (
    <div>
      <div className="relative mx-auto h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={84} paddingAngle={total ? 3 : 0} stroke="none">
              {data.map((item) => (
                <Cell key={item.label} fill={item.color} />
              ))}
            </Pie>
            {total > 0 && <Tooltip {...tooltip} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-3xl font-extrabold text-ink">{total}</span>
          <span className="text-xs font-medium text-muted">tasks</span>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} aria-hidden="true" />
            {item.label}
            <strong className="text-ink">{item.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
