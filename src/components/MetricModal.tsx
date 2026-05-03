import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { AggregationType, Category, Metric, MetricType } from '@/types';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  category: Category;
  metric?: Metric | null;
  onClose: () => void;
}

const TYPE_OPTIONS: Array<{ value: MetricType; label: string; hint: string }> = [
  { value: 'number', label: 'Number', hint: 'free-form value (kg, $, kcal)' },
  { value: 'duration', label: 'Duration', hint: 'minutes spent on something' },
  { value: 'count', label: 'Count', hint: 'integer (sessions, glasses)' },
  { value: 'boolean', label: 'Yes / No', hint: 'did/didn\'t do today' },
  { value: 'scale', label: 'Scale', hint: 'rating like mood 1–5' },
];

const AGG_OPTIONS: Array<{ value: AggregationType; label: string; hint: string }> = [
  { value: 'sum', label: 'Sum', hint: 'total over period' },
  { value: 'avg', label: 'Average', hint: 'avg of daily values' },
  { value: 'last', label: 'Last', hint: 'most recent value' },
  { value: 'max', label: 'Max', hint: 'highest in period' },
  { value: 'min', label: 'Min', hint: 'lowest in period' },
  { value: 'count', label: 'Count', hint: 'number of entries' },
];

export function MetricModal({ open, category, metric, onClose }: Props) {
  const addMetric = useStore((s) => s.addMetric);
  const updateMetric = useStore((s) => s.updateMetric);
  const deleteMetric = useStore((s) => s.deleteMetric);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [type, setType] = useState<MetricType>('number');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [pinned, setPinned] = useState(false);
  const [scaleMin, setScaleMin] = useState(1);
  const [scaleMax, setScaleMax] = useState(5);
  const [defaultValue, setDefaultValue] = useState<number>(0);

  useEffect(() => {
    if (metric) {
      setName(metric.name);
      setUnit(metric.unit);
      setType(metric.type);
      setAggregation(metric.aggregation);
      setDirection(metric.direction);
      setPinned(metric.pinned);
      setScaleMin(metric.scaleMin ?? 1);
      setScaleMax(metric.scaleMax ?? 5);
      setDefaultValue(metric.defaultValue ?? 0);
    } else {
      setName('');
      setUnit('');
      setType('number');
      setAggregation('sum');
      setDirection('up');
      setPinned(false);
      setScaleMin(1);
      setScaleMax(5);
      setDefaultValue(0);
    }
  }, [metric, open]);

  // Auto-suggest sensible aggregation when type changes
  useEffect(() => {
    if (metric) return; // don't override on edit
    if (type === 'boolean') setAggregation('last');
    else if (type === 'scale') setAggregation('avg');
    else if (type === 'duration' || type === 'count') setAggregation('sum');
    else setAggregation('sum');
  }, [type, metric]);

  const handleSave = () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      unit: unit.trim(),
      type,
      aggregation,
      direction,
      pinned,
      scaleMin: type === 'scale' ? scaleMin : undefined,
      scaleMax: type === 'scale' ? scaleMax : undefined,
      defaultValue,
      categoryId: category.id,
    };
    if (metric) {
      updateMetric(metric.id, data);
    } else {
      addMetric(data);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!metric) return;
    if (
      confirm(
        `Delete "${metric.name}" and all its entries? This cannot be undone.`,
      )
    ) {
      deleteMetric(metric.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-surface-2 border border-border-strong rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-surface-2 z-10">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">
                  {metric ? 'Edit metric' : 'New metric'} · {category.name}
                </div>
                <div className="font-serif text-xl">{metric ? metric.name : 'Create metric'}</div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md text-text-3 hover:text-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name + Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pages read"
                    autoFocus
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. pages"
                    disabled={type === 'boolean' || type === 'scale'}
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={cn(
                        'p-2 rounded-md border text-xs transition-colors text-center',
                        type === t.value
                          ? 'border-text-2 bg-surface-3 text-text'
                          : 'border-border text-text-2 hover:border-border-strong',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-text-3 mt-2">
                  {TYPE_OPTIONS.find((t) => t.value === type)?.hint}
                </div>
              </div>

              {/* Aggregation */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                  Aggregation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AGG_OPTIONS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAggregation(a.value)}
                      className={cn(
                        'p-2 rounded-md border text-xs transition-colors',
                        aggregation === a.value
                          ? 'border-text-2 bg-surface-3 text-text'
                          : 'border-border text-text-2 hover:border-border-strong',
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-text-3 mt-2">
                  {AGG_OPTIONS.find((a) => a.value === aggregation)?.hint}
                </div>
              </div>

              {/* Scale-specific */}
              {type === 'scale' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                      Min
                    </label>
                    <input
                      type="number"
                      value={scaleMin}
                      onChange={(e) => setScaleMin(parseInt(e.target.value) || 1)}
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                      Max
                    </label>
                    <input
                      type="number"
                      value={scaleMax}
                      onChange={(e) => setScaleMax(parseInt(e.target.value) || 5)}
                      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-border-strong"
                    />
                  </div>
                </div>
              )}

              {/* Direction */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-text-3 mb-2">
                  Higher is...
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDirection('up')}
                    className={cn(
                      'p-2 rounded-md border text-xs transition-colors',
                      direction === 'up'
                        ? 'border-text-2 bg-surface-3 text-text'
                        : 'border-border text-text-2 hover:border-border-strong',
                    )}
                  >
                    Better (study time, savings)
                  </button>
                  <button
                    onClick={() => setDirection('down')}
                    className={cn(
                      'p-2 rounded-md border text-xs transition-colors',
                      direction === 'down'
                        ? 'border-text-2 bg-surface-3 text-text'
                        : 'border-border text-text-2 hover:border-border-strong',
                    )}
                  >
                    Worse (calories on a cut)
                  </button>
                </div>
              </div>

              {/* Pin to today */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm">Pin to Today's quick log</div>
                  <div className="text-[11px] text-text-3">
                    Shows as a chip on the Today page for one-tap logging
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
              </label>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-between bg-surface/40 sticky bottom-0">
              {metric ? (
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 text-xs text-rose-400/80 hover:text-rose-400"
                >
                  Delete
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-text-2 hover:text-text">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ backgroundColor: category.color, color: '#0f0e0d' }}
                >
                  {metric ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
