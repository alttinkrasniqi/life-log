import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  label: string;
  value: string;
  unit?: string;
  delta?: {
    direction: 'up' | 'down' | 'flat';
    label: string;
  };
  /**
   * Whether the metric is "good when up" or "good when down".
   * Used to color the delta indicator.
   */
  positiveDirection?: 'up' | 'down';
  sparkline?: React.ReactNode;
  color?: string;
  serif?: boolean;
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  positiveDirection = 'up',
  sparkline,
  color,
  serif = true,
}: Props) {
  const deltaColor =
    !delta || delta.direction === 'flat'
      ? 'text-text-3'
      : (delta.direction === 'up' && positiveDirection === 'up') ||
          (delta.direction === 'down' && positiveDirection === 'down')
        ? 'text-emerald-400/80'
        : 'text-rose-400/80';

  const DeltaIcon =
    !delta || delta.direction === 'flat'
      ? Minus
      : delta.direction === 'up'
        ? TrendingUp
        : TrendingDown;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">{label}</div>
        {color && (
          <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: color }} />
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div
          className={cn(
            'leading-none',
            serif ? 'font-serif text-[42px] tracking-tight' : 'text-3xl font-medium',
          )}
        >
          {value}
        </div>
        {unit && <div className="text-xs text-text-3">{unit}</div>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        {delta ? (
          <div className={cn('flex items-center gap-1 text-xs', deltaColor)}>
            <DeltaIcon className="w-3 h-3" strokeWidth={2} />
            <span>{delta.label}</span>
          </div>
        ) : (
          <div />
        )}
        {sparkline && <div className="opacity-80">{sparkline}</div>}
      </div>
    </div>
  );
}
