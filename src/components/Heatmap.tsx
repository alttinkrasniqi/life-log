import { useMemo } from 'react';
import { format, getDay, startOfWeek, addWeeks } from 'date-fns';
import type { HeatmapCell } from '@/lib/analytics';

interface Props {
  data: HeatmapCell[];
  color: string;
  /** cell size in px */
  cellSize?: number;
  gap?: number;
}

export function Heatmap({ data, color, cellSize = 11, gap = 3 }: Props) {
  // Organize cells into columns by week (Monday start)
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    const firstDate = new Date(data[0].date);
    const firstMonday = startOfWeek(firstDate, { weekStartsOn: 1 });
    const map = new Map(data.map((d) => [d.date, d]));

    const cols: Array<Array<HeatmapCell | null>> = [];
    let cursor = firstMonday;
    const last = new Date(data[data.length - 1].date);
    let weeks = 0;
    while (cursor <= last && weeks < 60) {
      const col: Array<HeatmapCell | null> = [];
      for (let day = 0; day < 7; day++) {
        const d = new Date(cursor);
        d.setDate(d.getDate() + day);
        const key = format(d, 'yyyy-MM-dd');
        col.push(map.get(key) ?? null);
      }
      cols.push(col);
      cursor = addWeeks(cursor, 1);
      weeks++;
    }
    return cols;
  }, [data]);

  // Month labels (one per first column of each month)
  const monthLabels = useMemo(() => {
    const labels: Array<{ x: number; label: string }> = [];
    let lastMonth = -1;
    columns.forEach((col, i) => {
      const firstReal = col.find((c) => c !== null);
      if (!firstReal) return;
      const m = new Date(firstReal.date).getMonth();
      if (m !== lastMonth) {
        labels.push({ x: i * (cellSize + gap), label: format(new Date(firstReal.date), 'MMM') });
        lastMonth = m;
      }
    });
    return labels;
  }, [columns, cellSize, gap]);

  const width = columns.length * (cellSize + gap);
  const height = 7 * (cellSize + gap) + 16;

  return (
    <div className="overflow-x-auto pb-2">
      <svg width={width + 4} height={height} className="block">
        {monthLabels.map((m, i) => (
          <text
            key={i}
            x={m.x + 2}
            y={10}
            fill="var(--text-3)"
            fontSize="9"
            fontFamily="Geist Mono"
          >
            {m.label}
          </text>
        ))}
        {columns.map((col, ci) =>
          col.map((cell, ri) => {
            const x = ci * (cellSize + gap);
            const y = ri * (cellSize + gap) + 14;
            if (cell === null) return null;
            const opacity = cell.intensity === 0 ? 0.04 : 0.15 + cell.intensity * 0.85;
            return (
              <rect
                key={`${ci}-${ri}`}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={cell.intensity === 0 ? 'var(--surface-3)' : color}
                opacity={opacity}
              >
                <title>
                  {format(new Date(cell.date), 'MMM d, yyyy')}: {cell.value || 'no entries'}
                </title>
              </rect>
            );
          }),
        )}
      </svg>
    </div>
  );
}
