import { cn } from '@/lib/cn';
import type { Period } from '@/types';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
];

interface Props {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-surface border border-border rounded-lg">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            value === p.value
              ? 'bg-surface-3 text-text'
              : 'text-text-2 hover:text-text',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
