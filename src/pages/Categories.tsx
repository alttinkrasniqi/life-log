import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CategoryModal } from '@/components/CategoryModal';
import type { Category } from '@/types';

export function Categories() {
  const categories = useStore((s) => s.categories);
  const metrics = useStore((s) => s.metrics);
  const entries = useStore((s) => s.entries);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const ordered = useMemo(
    () => Object.values(categories).sort((a, b) => a.order - b.order),
    [categories],
  );

  return (
    <div className="px-10 py-10 max-w-[1100px]">
      <header className="flex items-end justify-between mb-10 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-3">
            Categories
          </div>
          <h1 className="font-serif text-display tracking-tight italic">Areas of life</h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-strong rounded-md text-sm hover:bg-surface-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> New category
        </button>
      </header>

      {ordered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <div className="font-serif text-2xl italic text-text-2 mb-2">No categories yet</div>
          <div className="text-sm text-text-3 mb-4">
            Categories group your metrics by area of life
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="text-sm text-text underline underline-offset-4 decoration-text-3"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ordered.map((cat) => {
            const catMetrics = Object.values(metrics).filter((m) => m.categoryId === cat.id);
            const catEntries = Object.values(entries).filter((e) =>
              catMetrics.some((m) => m.id === e.metricId),
            );
            const Icon = (Icons as any)[cat.icon] as React.ComponentType<{
              className?: string;
              strokeWidth?: number;
            }>;
            return (
              <Link
                key={cat.id}
                to={`/categories/${cat.id}`}
                className="group bg-surface border border-border rounded-xl p-5 hover:border-border-strong transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color + '20', color: cat.color }}
                    >
                      {Icon && <Icon className="w-4 h-4" strokeWidth={2} />}
                    </div>
                    <div>
                      <div className="font-serif text-xl text-text">{cat.name}</div>
                      <div className="text-xs text-text-3 mt-1">
                        {catMetrics.length} {catMetrics.length === 1 ? 'metric' : 'metrics'} ·{' '}
                        {catEntries.length} {catEntries.length === 1 ? 'entry' : 'entries'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-3 group-hover:text-text-2 transition-colors mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CategoryModal open={open} category={editing} onClose={() => setOpen(false)} />
    </div>
  );
}
