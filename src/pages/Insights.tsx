import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PeriodTabs } from '@/components/PeriodTabs';
import { StatCard } from '@/components/StatCard';
import { Sparkline } from '@/components/Sparkline';
import { TrendChart } from '@/components/TrendChart';
import { dailyAggregations, delta, headlineValue } from '@/lib/analytics';
import { fmtValueRaw, fmtDelta } from '@/lib/format';
import { getPeriodRange, getPreviousPeriodRange, lastNDays } from '@/lib/date';
import type { Period, Metric, Category, Entry, PeriodRange } from '@/types';

export function Insights() {
  const [period, setPeriod] = useState<Period>('week');
  const categories = useStore((s) => s.categories);
  const metrics = useStore((s) => s.metrics);
  const entries = useStore((s) => s.entries);

  const allEntries = useMemo(() => Object.values(entries), [entries]);
  const orderedCategories = useMemo(
    () => Object.values(categories).sort((a, b) => a.order - b.order),
    [categories],
  );

  const totalEntries = allEntries.length;

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      {/* Header */}
      <header className="flex items-end justify-between mb-10 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-3">
            Insights
          </div>
          <h1 className="font-serif text-display tracking-tight italic">What you've done</h1>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} />
      </header>

      {totalEntries === 0 && (
        <div className="border border-dashed border-border rounded-xl py-16 text-center mb-12">
          <div className="font-serif text-2xl italic text-text-2 mb-2">
            Nothing to analyze yet
          </div>
          <div className="text-sm text-text-3">
            Log a few entries on the Today page and your insights will populate here
          </div>
        </div>
      )}

      {orderedCategories.map((cat) => {
        const catMetrics = Object.values(metrics)
          .filter((m) => m.categoryId === cat.id)
          .sort((a, b) => a.order - b.order);
        if (catMetrics.length === 0) return null;
        return (
          <CategorySection
            key={cat.id}
            category={cat}
            metrics={catMetrics}
            entries={allEntries}
            period={period}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// Category section
// ---------------------------------------------------------------------

interface CategorySectionProps {
  category: Category;
  metrics: Metric[];
  entries: Entry[];
  period: Period;
}

function CategorySection({ category, metrics, entries, period }: CategorySectionProps) {
  const range = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPreviousPeriodRange(period), [period]);

  // Show top 4 metrics: pinned first, then by order
  const topMetrics = useMemo(() => {
    return [...metrics]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.order - b.order;
      })
      .slice(0, 4);
  }, [metrics]);

  // Featured metric: first pinned, or first ordered, that has any entries
  const featuredMetric = useMemo(() => {
    const sorted = [...metrics].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.order - b.order;
    });
    return (
      sorted.find((m) => entries.some((e) => e.metricId === m.id)) ?? sorted[0]
    );
  }, [metrics, entries]);

  // Activity trend: 30 days of activity for charting featured metric
  const featuredData = useMemo(
    () => (featuredMetric ? dailyAggregations(entries, featuredMetric, lastNDays(30)) : []),
    [featuredMetric, entries],
  );

  // Skip if category has zero entries
  const hasAnyEntries = entries.some((e) =>
    metrics.some((m) => m.id === e.metricId),
  );
  if (!hasAnyEntries) return null;

  const Icon = (Icons as any)[category.icon] as React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;

  return (
    <section className="mb-16">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <Link
          to={`/categories/${category.id}`}
          className="flex items-center gap-3 group"
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ backgroundColor: category.color + '20', color: category.color }}
          >
            {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} />}
          </div>
          <h2 className="font-serif text-2xl text-text group-hover:text-text-2 transition-colors">
            {category.name}
          </h2>
          <ChevronRight className="w-4 h-4 text-text-3 group-hover:text-text-2 transition-colors" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {topMetrics.map((m) => (
          <MetricStatCard
            key={m.id}
            metric={m}
            entries={entries}
            color={category.color}
            period={period}
            range={range}
            prevRange={prevRange}
          />
        ))}
      </div>

      {/* Featured chart */}
      {featuredMetric && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-text-3 mb-1">
                Last 30 days · {featuredMetric.name}
              </div>
              <div className="text-xs text-text-3">
                Daily values · 7-day rolling average dashed
              </div>
            </div>
            <Link
              to={`/metrics/${featuredMetric.id}`}
              className="text-xs text-text-2 hover:text-text flex items-center gap-1"
            >
              Drill in <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <TrendChart
            data={featuredData}
            color={category.color}
            metric={featuredMetric}
            height={200}
          />
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------
// Stat card per metric
// ---------------------------------------------------------------------

interface MetricStatCardProps {
  metric: Metric;
  entries: Entry[];
  color: string;
  period: Period;
  range: PeriodRange;
  prevRange: PeriodRange;
}

function MetricStatCard({ metric, entries, color, period, range, prevRange }: MetricStatCardProps) {
  const current = headlineValue(entries, metric, range);
  const previous = period === 'all' ? 0 : headlineValue(entries, metric, prevRange);
  const d = delta(current, previous);

  // Sparkline: last 14 days
  const sparkData = useMemo(
    () => dailyAggregations(entries, metric, lastNDays(14)).map((d) => d.value),
    [entries, metric],
  );

  const positiveDirection = metric.direction === 'up' ? 'up' : 'down';

  const deltaLabel =
    period === 'all' || previous === 0
      ? d.direction === 'flat' ? '—' : 'new'
      : `${fmtDelta(d.absolute, current < 10 ? 1 : 0)} ${metric.unit || ''}`.trim();

  return (
    <Link to={`/metrics/${metric.id}`}>
      <StatCard
        label={metric.name}
        value={fmtValueRaw(current, metric)}
        unit={metric.unit}
        delta={
          period === 'all'
            ? undefined
            : {
                direction: d.direction,
                label: previous === 0 && current > 0 ? 'new' : deltaLabel,
              }
        }
        positiveDirection={positiveDirection}
        color={color}
        sparkline={
          sparkData.some((v) => v !== 0) ? (
            <Sparkline values={sparkData} color={color} width={70} height={24} />
          ) : null
        }
      />
    </Link>
  );
}
