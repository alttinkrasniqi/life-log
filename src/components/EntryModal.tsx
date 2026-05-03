import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Metric } from '@/types';
import { cn } from '@/lib/cn';
import { fmtDuration } from '@/lib/format';

interface Props {
  metric: Metric | null;
  onClose: () => void;
}

export function EntryModal({ metric, onClose }: Props) {
  const addEntry = useStore((s) => s.addEntry);
  const category = useStore((s) =>
    metric ? s.categories[metric.categoryId] : null,
  );
  const lastEntry = useStore((s) =>
    metric
      ? Object.values(s.entries)
          .filter((e) => e.metricId === metric.id)
          .sort((a, b) => b.timestamp - a.timestamp)[0]
      : null,
  );

  const [value, setValue] = useState<number>(0);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when metric changes
  useEffect(() => {
    if (metric) {
      const initial =
        metric.aggregation === 'last'
          ? lastEntry?.value ?? metric.defaultValue ?? 0
          : metric.defaultValue ?? 0;
      setValue(metric.type === 'boolean' ? 1 : initial);
      setNote('');
      setShowNote(false);
      // Focus the input for non-boolean/scale types
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [metric, lastEntry]);

  const handleSave = () => {
    if (!metric) return;
    addEntry({
      metricId: metric.id,
      value,
      note: note.trim() || undefined,
      timestamp: Date.now(),
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {metric && (
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
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="w-full max-w-md bg-surface-2 border border-border-strong rounded-2xl shadow-2xl overflow-hidden"
            tabIndex={-1}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category?.color }}
                />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">
                    Log {category?.name}
                  </div>
                  <div className="font-serif text-xl">{metric.name}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-text-3 hover:text-text hover:bg-surface-3 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body — switches based on metric type */}
            <div className="p-6">
              {metric.type === 'number' && (
                <NumberInput
                  inputRef={inputRef}
                  value={value}
                  setValue={setValue}
                  metric={metric}
                />
              )}
              {metric.type === 'duration' && (
                <DurationInput
                  inputRef={inputRef}
                  value={value}
                  setValue={setValue}
                  metric={metric}
                />
              )}
              {metric.type === 'count' && (
                <CountInput
                  inputRef={inputRef}
                  value={value}
                  setValue={setValue}
                  metric={metric}
                />
              )}
              {metric.type === 'scale' && (
                <ScaleInput value={value} setValue={setValue} metric={metric} />
              )}
              {metric.type === 'boolean' && (
                <BooleanInput value={value} setValue={setValue} />
              )}

              {/* Note */}
              <div className="mt-6">
                {!showNote ? (
                  <button
                    onClick={() => setShowNote(true)}
                    className="text-xs text-text-3 hover:text-text-2 transition-colors"
                  >
                    + Add note
                  </button>
                ) : (
                  <textarea
                    placeholder="Optional note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text placeholder-text-3 focus:outline-none focus:border-border-strong resize-none"
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-surface/40">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-2 hover:text-text rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium rounded-md flex items-center gap-1.5 transition-all hover:brightness-110"
                style={{
                  backgroundColor: category?.color,
                  color: '#0f0e0d',
                }}
              >
                <Check className="w-4 h-4" />
                Log entry
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------
// Type-specific inputs
// ---------------------------------------------------------------------

interface InputProps {
  value: number;
  setValue: (v: number) => void;
  metric: Metric;
  inputRef?: React.RefObject<HTMLInputElement>;
}

function NumberInput({ value, setValue, metric, inputRef }: InputProps) {
  return (
    <div>
      <div className="flex items-baseline gap-2 justify-center">
        <input
          ref={inputRef}
          type="number"
          step="any"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          className="font-serif text-display text-center bg-transparent border-none outline-none text-text w-full no-spin"
          style={{ width: '100%' }}
        />
      </div>
      <div className="text-center text-xs uppercase tracking-[0.2em] text-text-3 mt-2">
        {metric.unit}
      </div>
      {metric.quickValues && metric.quickValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {metric.quickValues.map((v) => (
            <button
              key={v}
              onClick={() => setValue(v)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-colors',
                value === v
                  ? 'border-text-2 text-text bg-surface-3'
                  : 'border-border text-text-2 hover:border-border-strong',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DurationInput({ value, setValue, metric, inputRef }: InputProps) {
  return (
    <div>
      <div className="flex items-baseline gap-2 justify-center">
        <input
          ref={inputRef}
          type="number"
          step="1"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          className="font-serif text-display text-center bg-transparent border-none outline-none text-text w-full no-spin"
        />
      </div>
      <div className="text-center text-xs uppercase tracking-[0.2em] text-text-3 mt-2">
        minutes
      </div>
      <div className="text-center text-xs text-text-3 mt-1">{fmtDuration(value)}</div>
      <div className="flex flex-wrap gap-2 mt-6 justify-center">
        {(metric.quickValues ?? [15, 30, 45, 60, 90]).map((v) => (
          <button
            key={v}
            onClick={() => setValue(v)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full border transition-colors',
              value === v
                ? 'border-text-2 text-text bg-surface-3'
                : 'border-border text-text-2 hover:border-border-strong',
            )}
          >
            {fmtDuration(v, true)}
          </button>
        ))}
      </div>
    </div>
  );
}

function CountInput({ value, setValue, metric, inputRef }: InputProps) {
  return (
    <div>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setValue(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-full border border-border text-text-2 hover:border-border-strong hover:text-text transition-colors text-xl"
          aria-label="Decrease"
        >
          −
        </button>
        <input
          ref={inputRef}
          type="number"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          className="font-serif text-display text-center bg-transparent border-none outline-none text-text w-32 no-spin"
        />
        <button
          onClick={() => setValue(value + 1)}
          className="w-10 h-10 rounded-full border border-border text-text-2 hover:border-border-strong hover:text-text transition-colors text-xl"
          aria-label="Increase"
        >
          +
        </button>
      </div>
      <div className="text-center text-xs uppercase tracking-[0.2em] text-text-3 mt-2">
        {value === 1 ? metric.unit : `${metric.unit}s`}
      </div>
    </div>
  );
}

function ScaleInput({ value, setValue, metric }: InputProps) {
  const min = metric.scaleMin ?? 1;
  const max = metric.scaleMax ?? 5;
  const range = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div>
      <div className="font-serif text-display text-center">{value}</div>
      <div className="text-center text-xs uppercase tracking-[0.2em] text-text-3 mt-2 mb-6">
        {min === 1 && max === 5 ? 'how was it' : `${min} to ${max}`}
      </div>
      <div className="flex justify-center gap-2">
        {range.map((n) => (
          <button
            key={n}
            onClick={() => setValue(n)}
            className={cn(
              'w-12 h-12 rounded-full border text-sm font-medium transition-all',
              value === n
                ? 'border-text-2 bg-surface-3 text-text scale-110'
                : 'border-border text-text-2 hover:border-border-strong',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function BooleanInput({
  value,
  setValue,
}: {
  value: number;
  setValue: (v: number) => void;
}) {
  return (
    <div className="flex justify-center gap-3">
      <button
        onClick={() => setValue(1)}
        className={cn(
          'flex-1 py-6 rounded-xl border text-base font-medium transition-all',
          value === 1
            ? 'border-text-2 bg-surface-3 text-text'
            : 'border-border text-text-2 hover:border-border-strong',
        )}
      >
        Yes
      </button>
      <button
        onClick={() => setValue(0)}
        className={cn(
          'flex-1 py-6 rounded-xl border text-base font-medium transition-all',
          value === 0
            ? 'border-text-2 bg-surface-3 text-text'
            : 'border-border text-text-2 hover:border-border-strong',
        )}
      >
        No
      </button>
    </div>
  );
}
