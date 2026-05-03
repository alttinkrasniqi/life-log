import { useMemo, useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fmtFullDate, fmtTime, todayRange } from '@/lib/date';
import { fmtValue, fmtValueRaw } from '@/lib/format';
import { headlineValue } from '@/lib/analytics';
import { EntryModal } from '@/components/EntryModal';
import type { Metric } from '@/types';
import { cn } from '@/lib/cn';

export function Today() {
  const categories = useStore((s) => s.categories);
  const metrics = useStore((s) => s.metrics);
  const entries = useStore((s) => s.entries);
  const deleteEntry = useStore((s) => s.deleteEntry);

  const [activeMetric, setActiveMetric] = useState<Metric | null>(null);

  const range = todayRange();

  // Pinned metrics for quick-add, ordered by category order then metric order
  const pinnedMetrics = useMemo(() => {
    return Object.values(metrics)
      .filter((m) => m.pinned)
      .sort((a, b) => {
        const ca = categories[a.categoryId]?.order ?? 0;
        const cb = categories[b.categoryId]?.order ?? 0;
        if (ca !== cb) return ca - cb;
        return a.order - b.order;
      });
  }, [metrics, categories]);

  // Today's entries, grouped by metric
  const todaysEntries = useMemo(() => {
    return Object.values(entries)
      .filter((e) => e.timestamp >= range.start && e.timestamp <= range.end)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, range.start, range.end]);

  // Today's totals per category — only categories that had activity
  const todayTotalsByCategory = useMemo(() => {
    const all = Object.values(entries).filter(
      (e) => e.timestamp >= range.start && e.timestamp <= range.end,
    );
    const byCat = new Map<string, { count: number; metrics: Set<string> }>();
    for (const e of all) {
      const m = metrics[e.metricId];
      if (!m) continue;
      const cat = m.categoryId;
      if (!byCat.has(cat)) byCat.set(cat, { count: 0, metrics: new Set() });
      const b = byCat.get(cat)!;
      b.count++;
      b.metrics.add(m.id);
    }
    return Array.from(byCat.entries())
      .map(([catId, info]) => ({
        category: categories[catId],
        count: info.count,
        metrics: info.metrics.size,
      }))
      .filter((x) => x.category)
      .sort((a, b) => a.category.order - b.category.order);
  }, [entries, metrics, categories, range.start, range.end]);

  return (
    <div className="px-10 py-10 max-w-[1100px]">
      {/* Header */}
      <header className="mb-12">
        <div className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-3">Today</div>
        <h1 className="font-serif text-display tracking-tight">
          <span className="italic">{fmtFullDate(new Date()).split(',')[0]}</span>
          <span className="text-text-2 not-italic font-light">
            ,{fmtFullDate(new Date()).split(',').slice(1).join(',')}
          </span>
        </h1>
      </header>

      {/* Today's category snapshot */}
      {todayTotalsByCategory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-12">
          {todayTotalsByCategory.map((c) => (
            <div
              key={c.category.id}
              className="bg-surface border border-border rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: c.category.color }}
                />
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">
                  {c.category.name}
                </div>
              </div>
              <div className="mt-2 font-serif text-2xl">{c.count}</div>
              <div className="text-[10px] text-text-3 mt-0.5">
                {c.count === 1 ? 'entry' : 'entries'} · {c.metrics}{' '}
                {c.metrics === 1 ? 'metric' : 'metrics'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick add */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3">Quick log</h2>
          <span className="text-[10px] text-text-3">tap to log</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {pinnedMetrics.map((m) => {
            const cat = categories[m.categoryId];
            return (
              <QuickAddChip
                key={m.id}
                metric={m}
                color={cat?.color}
                onClick={() => setActiveMetric(m)}
              />
            );
          })}
          {pinnedMetrics.length === 0 && (
            <div className="text-sm text-text-3">
              No pinned metrics yet. Pin metrics from the Categories page to add them here.
            </div>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3">
            Today's timeline
          </h2>
          <span className="text-[10px] text-text-3">
            {todaysEntries.length} {todaysEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {todaysEntries.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl py-16 text-center">
            <div className="text-text-2 text-sm">Nothing logged yet today</div>
            <div className="text-text-3 text-xs mt-1">
              Tap any chip above to log an action — under 30 seconds
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
            {todaysEntries.map((e) => {
              const m = metrics[e.metricId];
              const cat = m ? categories[m.categoryId] : null;
              if (!m) return null;
              return (
                <div
                  key={e.id}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-surface-2 transition-colors group"
                >
                  <div className="font-mono text-xs text-text-3 w-12 shrink-0">
                    {fmtTime(e.timestamp)}
                  </div>
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat?.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-sm text-text">{m.name}</div>
                      <div className="font-serif text-base text-text">
                        {fmtValue(e.value, m)}
                      </div>
                    </div>
                    {e.note && (
                      <div className="text-xs text-text-3 mt-1 italic line-clamp-2">
                        {e.note}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this entry?')) deleteEntry(e.id);
                    }}
                    className="text-text-3 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    aria-label="Delete entry"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <EntryModal metric={activeMetric} onClose={() => setActiveMetric(null)} />
    </div>
  );
}

interface QuickAddChipProps {
  metric: Metric;
  color?: string;
  onClick: () => void;
}

function QuickAddChip({ metric, color, onClick }: QuickAddChipProps) {
  // Today's headline for this metric — quick context shown on chip
  const entries = useStore((s) => s.entries);
  const range = todayRange();
  const todayValue = headlineValue(Object.values(entries), metric, range);
  const hasValue = todayValue !== 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all',
        'border-border bg-surface hover:bg-surface-2 hover:border-border-strong',
      )}
      style={{
        borderColor: hasValue ? color + '40' : undefined,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm text-text">{metric.name}</span>
      {hasValue && (
        <span className="text-xs text-text-2 font-mono">
          {fmtValueRaw(todayValue, metric)}
          {metric.unit ? ` ${metric.unit}` : ''}
        </span>
      )}
      <Plus
        className="w-3.5 h-3.5 text-text-3 group-hover:text-text-2 transition-colors"
        strokeWidth={1.5}
      />
    </button>
  );
}
