import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Target as TargetIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { TrendChart } from '@/components/TrendChart';
import { Heatmap } from '@/components/Heatmap';
import { PeriodTabs } from '@/components/PeriodTabs';
import { EntryModal } from '@/components/EntryModal';
import { MetricModal } from '@/components/MetricModal';
import {
  consistency,
  dailyAggregations,
  delta,
  headlineValue,
  heatmapData,
  metricStats,
  streak,
} from '@/lib/analytics';
import {
  getPeriodRange,
  getPreviousPeriodRange,
  lastNDays,
  fmtRelative,
} from '@/lib/date';
import { fmtDelta, fmtPercent, fmtValue, fmtValueRaw } from '@/lib/format';
import type { Period } from '@/types';
import { cn } from '@/lib/cn';

export function MetricDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const metric = useStore((s) => (id ? s.metrics[id] : undefined));
  const category = useStore((s) =>
    metric ? s.categories[metric.categoryId] : undefined,
  );
  const entries = useStore((s) => s.entries);
  const targets = useStore((s) => s.targets);
  const setTarget = useStore((s) => s.setTarget);
  const deleteTarget = useStore((s) => s.deleteTarget);
  const deleteEntry = useStore((s) => s.deleteEntry);

  const [period, setPeriod] = useState<Period>('month');
  const [logging, setLogging] = useState(false);
  const [editing, setEditing] = useState(false);

  const allEntries = useMemo(() => Object.values(entries), [entries]);
  const target = useMemo(
    () => (id ? Object.values(targets).find((t) => t.metricId === id) : undefined),
    [targets, id],
  );

  // ALWAYS call hooks before any conditional return — keep these unconditional
  const range = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPreviousPeriodRange(period), [period]);

  const stats = useMemo(
    () =>
      metric
        ? metricStats(allEntries, metric, range)
        : { total: 0, avg: 0, min: 0, max: 0, count: 0, last: null, activeDays: 0 },
    [allEntries, metric, range],
  );

  const streakInfo = useMemo(() => (metric ? streak(allEntries, metric.id) : { current: 0, longest: 0 }), [allEntries, metric]);

  const consistencyPct = useMemo(
    () => (metric ? consistency(allEntries, metric.id, range) : 0),
    [allEntries, metric, range],
  );

  const headline = useMemo(
    () => (metric ? headlineValue(allEntries, metric, range) : 0),
    [allEntries, metric, range],
  );
  const prevHeadline = useMemo(
    () => (metric && period !== 'all' ? headlineValue(allEntries, metric, prevRange) : 0),
    [allEntries, metric, period, prevRange],
  );
  const d = delta(headline, prevHeadline);

  const chartRange = useMemo(() => {
    switch (period) {
      case 'week':
        return lastNDays(14);
      case 'month':
        return lastNDays(30);
      case 'year':
        return lastNDays(180);
      case 'all':
        return lastNDays(365);
    }
  }, [period]);

  const chartData = useMemo(
    () => (metric ? dailyAggregations(allEntries, metric, chartRange) : []),
    [allEntries, metric, chartRange],
  );

  const heatmap = useMemo(
    () => (metric ? heatmapData(allEntries, metric.id, 365) : []),
    [allEntries, metric],
  );

  const recentEntries = useMemo(() => {
    if (!metric) return [];
    return allEntries
      .filter((e) => e.metricId === metric.id)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [allEntries, metric]);

  if (!metric || !category) {
    return (
      <div className="px-5 py-6 md:px-10 md:py-10">
        <div className="text-text-2">Metric not found.</div>
        <Link to="/categories" className="text-sm text-accent mt-4 inline-block">
          ← Back to categories
        </Link>
      </div>
    );
  }

  const positive = metric.direction === 'up' ? 'up' : 'down';

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-[1100px]">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-text-3 hover:text-text-2 mb-6"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      {/* Header */}
      <header className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <Link
            to={`/categories/${category.id}`}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-text-3 mb-3 hover:text-text-2"
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </Link>
          <h1 className="font-serif text-display tracking-tight italic">{metric.name}</h1>
          <div className="text-xs text-text-3 mt-2 capitalize">
            {metric.type} · {metric.aggregation}
            {metric.unit ? ` · ${metric.unit}` : ''}
            {metric.direction === 'down' ? ' · lower is better' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-2 border border-border rounded-md hover:border-border-strong"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={() => setLogging(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all hover:brightness-110"
            style={{ backgroundColor: category.color, color: '#0f0e0d' }}
          >
            <Plus className="w-3 h-3" /> Log entry
          </button>
        </div>
      </header>

      {/* Big headline + period tabs */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
              {period === 'all' ? 'All-time' : `This ${period}`}
            </div>
            <div className="flex items-baseline gap-3">
              <div className="font-serif text-[48px] md:text-[64px] leading-none tracking-tight break-all">
                {fmtValueRaw(headline, metric)}
              </div>
              {metric.unit && metric.type !== 'boolean' && (
                <div className="text-text-3 text-sm">{metric.unit}</div>
              )}
            </div>
            {period !== 'all' && prevHeadline !== 0 && (
              <div
                className={cn(
                  'mt-3 text-xs',
                  d.direction === 'flat'
                    ? 'text-text-3'
                    : (d.direction === 'up' && positive === 'up') ||
                        (d.direction === 'down' && positive === 'down')
                      ? 'text-emerald-400/80'
                      : 'text-rose-400/80',
                )}
              >
                {fmtDelta(d.absolute, headline < 10 ? 1 : 0)} {metric.unit || ''} ·{' '}
                {fmtDelta(d.percent * 100, 0)}% vs previous {period}
              </div>
            )}
          </div>
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total" value={fmtValueRaw(stats.total, metric)} unit={metric.unit} />
          <Stat label="Average / day" value={fmtValueRaw(stats.avg, metric)} unit={metric.unit} />
          <Stat label="Highest" value={fmtValueRaw(stats.max, metric)} unit={metric.unit} />
          <Stat label="Lowest" value={fmtValueRaw(stats.min, metric)} unit={metric.unit} />
          <Stat label="Entries" value={String(stats.count)} unit="logs" />
          <Stat label="Active days" value={String(stats.activeDays)} unit="days" />
          <Stat label="Current streak" value={String(streakInfo.current)} unit="days" />
          <Stat label="Longest streak" value={String(streakInfo.longest)} unit="days" />
        </div>

        <div className="mt-3 text-xs text-text-3">
          Consistency this {period === 'all' ? 'all-time' : period}:{' '}
          <span className="text-text-2">{fmtPercent(consistencyPct)}</span>
        </div>
      </section>

      {/* Trend chart */}
      <section className="mb-10">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-4">
          {period === 'week' && 'Last 14 days'}
          {period === 'month' && 'Last 30 days'}
          {period === 'year' && 'Last 6 months'}
          {period === 'all' && 'Last year'}
        </h2>
        <div className="bg-surface border border-border rounded-xl p-5">
          <TrendChart
            data={chartData}
            color={category.color}
            metric={metric}
            height={280}
            rollingWindow={period === 'week' ? 3 : period === 'year' ? 14 : 7}
          />
        </div>
      </section>

      {/* Target */}
      <section className="mb-10">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-4">Target</h2>
        <TargetEditor
          metric={metric}
          target={target}
          color={category.color}
          onSet={(value, period, comparator) =>
            setTarget({ metricId: metric.id, value, period, comparator })
          }
          onClear={() => target && deleteTarget(target.id)}
        />
      </section>

      {/* Heatmap */}
      <section className="mb-10">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-4">
          Activity · last 365 days
        </h2>
        <div className="bg-surface border border-border rounded-xl p-5">
          <Heatmap data={heatmap} color={category.color} />
        </div>
      </section>

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-4">
            Recent entries
          </h2>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
            {recentEntries.map((e) => (
              <div
                key={e.id}
                className="px-5 py-3 flex items-center gap-4 group hover:bg-surface-2 transition-colors"
              >
                <div className="font-mono text-[10px] text-text-3 w-28 shrink-0">
                  {fmtRelative(e.timestamp)}
                </div>
                <div className="font-serif text-base flex-1">{fmtValue(e.value, metric)}</div>
                {e.note && (
                  <div className="text-xs text-text-3 italic max-w-[300px] truncate">
                    "{e.note}"
                  </div>
                )}
                <button
                  onClick={() => {
                    if (confirm('Delete this entry?')) deleteEntry(e.id);
                  }}
                  className="text-text-3 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <EntryModal metric={logging ? metric : null} onClose={() => setLogging(false)} />
      <MetricModal
        open={editing}
        category={category}
        metric={metric}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <div className="font-serif text-2xl">{value}</div>
        {unit && <div className="text-[11px] text-text-3">{unit}</div>}
      </div>
    </div>
  );
}

function TargetEditor({
  metric,
  target,
  color,
  onSet,
  onClear,
}: {
  metric: { id: string; unit: string };
  target: { id: string; value: number; period: 'weekly' | 'monthly'; comparator: 'gte' | 'lte' } | undefined;
  color: string;
  onSet: (value: number, period: 'weekly' | 'monthly', comparator: 'gte' | 'lte') => void;
  onClear: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number>(target?.value ?? 0);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>(target?.period ?? 'weekly');
  const [comparator, setComparator] = useState<'gte' | 'lte'>(target?.comparator ?? 'gte');

  if (!editing && !target) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-xl text-sm text-text-2 hover:border-border-strong w-full"
      >
        <TargetIcon className="w-4 h-4" /> Set a target for adherence tracking
      </button>
    );
  }

  if (!editing && target) {
    return (
      <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-3">
        <div className="flex items-center gap-3">
          <TargetIcon className="w-4 h-4" style={{ color }} />
          <div>
            <div className="text-sm">
              {target.comparator === 'gte' ? 'At least' : 'At most'}{' '}
              <span className="font-serif text-lg">{target.value}</span>{' '}
              <span className="text-text-3 text-xs">{metric.unit}</span> per {target.period.replace('ly', '')}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setValue(target.value);
              setPeriod(target.period);
              setComparator(target.comparator);
              setEditing(true);
            }}
            className="text-xs text-text-2 hover:text-text px-2 py-1"
          >
            Edit
          </button>
          <button
            onClick={onClear}
            className="text-xs text-rose-400/80 hover:text-rose-400 px-2 py-1"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-text-3">Direction</label>
          <select
            value={comparator}
            onChange={(e) => setComparator(e.target.value as 'gte' | 'lte')}
            className="mt-2 w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="gte">At least ≥</option>
            <option value="lte">At most ≤</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-text-3">Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            className="mt-2 w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-text-3">Per</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly')}
            className="mt-2 w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="weekly">Week</option>
            <option value="monthly">Month</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-text-2 hover:text-text px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onSet(value, period, comparator);
            setEditing(false);
          }}
          className="text-xs px-3 py-1.5 rounded-md font-medium hover:brightness-110"
          style={{ backgroundColor: color, color: '#0f0e0d' }}
        >
          Save target
        </button>
      </div>
    </div>
  );
}
