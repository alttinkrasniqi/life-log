import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, ArrowLeft, Pencil, Pin, PinOff } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useStore } from '@/store/useStore';
import { MetricModal } from '@/components/MetricModal';
import { CategoryModal } from '@/components/CategoryModal';
import { Sparkline } from '@/components/Sparkline';
import { EntryModal } from '@/components/EntryModal';
import { dailyAggregations, headlineValue } from '@/lib/analytics';
import { lastNDays, getPeriodRange, fmtRelative } from '@/lib/date';
import { fmtValue, fmtValueRaw } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Metric } from '@/types';

export function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const category = useStore((s) => (id ? s.categories[id] : undefined));
  const metrics = useStore((s) => s.metrics);
  const entries = useStore((s) => s.entries);
  const togglePinMetric = useStore((s) => s.togglePinMetric);

  const [editingCat, setEditingCat] = useState(false);
  const [metricModal, setMetricModal] = useState<{ open: boolean; metric: Metric | null }>({
    open: false,
    metric: null,
  });
  const [logging, setLogging] = useState<Metric | null>(null);

  const allEntries = useMemo(() => Object.values(entries), [entries]);

  const catMetrics = useMemo(() => {
    if (!id) return [];
    return Object.values(metrics)
      .filter((m) => m.categoryId === id)
      .sort((a, b) => a.order - b.order);
  }, [metrics, id]);

  const recentEntries = useMemo(() => {
    if (!id) return [];
    const metricIds = new Set(catMetrics.map((m) => m.id));
    return allEntries
      .filter((e) => metricIds.has(e.metricId))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 12);
  }, [allEntries, catMetrics, id]);

  if (!category) {
    return (
      <div className="px-5 py-6 md:px-10 md:py-10">
        <div className="text-text-2">Category not found.</div>
        <Link to="/categories" className="text-sm text-accent mt-4 inline-block">
          ← Back to categories
        </Link>
      </div>
    );
  }

  const Icon = (Icons as any)[category.icon] as React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;

  const monthRange = getPeriodRange('month');

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-[1100px]">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-text-3 hover:text-text-2 mb-6"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      {/* Header */}
      <header className="flex items-start justify-between mb-8 md:mb-12 gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: category.color + '20', color: category.color }}
          >
            {Icon && <Icon className="w-5 h-5" strokeWidth={2} />}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-2">
              Category
            </div>
            <h1 className="font-serif text-display tracking-tight italic">{category.name}</h1>
          </div>
        </div>
        <button
          onClick={() => setEditingCat(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-2 border border-border rounded-md hover:border-border-strong"
        >
          <Pencil className="w-3 h-3" /> Edit
        </button>
      </header>

      {/* Metrics grid */}
      <section className="mb-8 md:mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3">Metrics</h2>
          <button
            onClick={() => setMetricModal({ open: true, metric: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface border border-border rounded-md hover:bg-surface-2"
          >
            <Plus className="w-3 h-3" /> New metric
          </button>
        </div>

        {catMetrics.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl py-12 text-center">
            <div className="text-text-2 text-sm">No metrics yet in this category</div>
            <button
              onClick={() => setMetricModal({ open: true, metric: null })}
              className="text-xs text-text-3 hover:text-text-2 mt-2 underline underline-offset-4"
            >
              Create your first metric
            </button>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
            {catMetrics.map((m) => {
              const monthHeadline = headlineValue(allEntries, m, monthRange);
              const sparkData = dailyAggregations(allEntries, m, lastNDays(30)).map(
                (d) => d.value,
              );
              const hasData = sparkData.some((v) => v !== 0);

              return (
                <div
                  key={m.id}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-surface-2 transition-colors group"
                >
                  <Link
                    to={`/metrics/${m.id}`}
                    className="flex-1 flex items-center gap-4 min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-text">{m.name}</div>
                        {m.pinned && (
                          <span className="text-[9px] uppercase tracking-[0.15em] text-text-3 border border-border rounded-full px-1.5 py-0.5">
                            pinned
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-3 mt-1 capitalize">
                        {m.type} · {m.aggregation} · {m.unit || 'no unit'}
                      </div>
                    </div>
                    <div className="hidden md:block w-[120px]">
                      <Sparkline values={sparkData} color={category.color} width={120} height={32} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-serif text-lg">
                        {hasData ? fmtValueRaw(monthHeadline, m) : '—'}
                      </div>
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.15em]">
                        {hasData ? `this month` : 'no data'}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePinMetric(m.id)}
                      className={cn(
                        'p-1.5 rounded-md text-text-3 hover:text-text-2 hover:bg-surface-3 transition-colors opacity-0 group-hover:opacity-100',
                      )}
                      title={m.pinned ? 'Unpin from Today' : 'Pin to Today'}
                    >
                      {m.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setLogging(m)}
                      className="px-3 py-1.5 text-xs rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      Log
                    </button>
                    <button
                      onClick={() => setMetricModal({ open: true, metric: m })}
                      className="p-1.5 text-text-3 hover:text-text-2 opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <section>
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-4">
            Recent entries
          </h2>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
            {recentEntries.map((e) => {
              const m = metrics[e.metricId];
              if (!m) return null;
              return (
                <Link
                  key={e.id}
                  to={`/metrics/${m.id}`}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors"
                >
                  <div className="font-mono text-[10px] text-text-3 w-24 shrink-0">
                    {fmtRelative(e.timestamp)}
                  </div>
                  <div className="text-sm text-text-2 flex-1 min-w-0 truncate">{m.name}</div>
                  {e.note && (
                    <div className="text-xs text-text-3 italic truncate max-w-[200px] hidden md:block">
                      "{e.note}"
                    </div>
                  )}
                  <div className="font-serif text-base shrink-0">{fmtValue(e.value, m)}</div>
                  <ChevronRight className="w-3 h-3 text-text-3" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <CategoryModal
        open={editingCat}
        category={category}
        onClose={() => setEditingCat(false)}
      />
      <MetricModal
        open={metricModal.open}
        category={category}
        metric={metricModal.metric}
        onClose={() => setMetricModal({ open: false, metric: null })}
      />
      <EntryModal metric={logging} onClose={() => setLogging(null)} />
    </div>
  );
}
