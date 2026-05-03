import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import type { Metric } from '@/types';
import type { DailyAggregation } from '@/types';
import { rollingAverage } from '@/lib/analytics';
import { fmtValue } from '@/lib/format';

interface Props {
  data: DailyAggregation[];
  color: string;
  metric: Metric;
  height?: number;
  showRolling?: boolean;
  rollingWindow?: number;
}

export function TrendChart({
  data,
  color,
  metric,
  height = 240,
  showRolling = true,
  rollingWindow = 7,
}: Props) {
  const enriched = useMemo(() => {
    const values = data.map((d) => d.value);
    const rolling = showRolling ? rollingAverage(values, rollingWindow) : [];
    return data.map((d, i) => ({
      ...d,
      rolling: showRolling ? rolling[i] : undefined,
      label: format(new Date(d.date), 'MMM d'),
    }));
  }, [data, showRolling, rollingWindow]);

  const id = `grad-${metric.id}`;

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div
        className="flex items-center justify-center text-text-3 text-sm border border-dashed border-border rounded-md"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={enriched} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--text-3)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          tick={{ fill: 'var(--text-3)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const p = payload[0].payload;
            return (
              <div className="bg-surface-2 border border-border-strong rounded-md px-3 py-2 text-xs shadow-xl">
                <div className="text-text-3 mb-1">{p.label}</div>
                <div className="font-medium text-text">{fmtValue(p.value, metric)}</div>
                {p.rolling != null && (
                  <div className="text-text-3 mt-1">
                    {rollingWindow}-day avg: {fmtValue(p.rolling, metric)}
                  </div>
                )}
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${id})`}
          dot={false}
          activeDot={{ r: 3, fill: color }}
        />
        {showRolling && (
          <Line
            type="monotone"
            dataKey="rolling"
            stroke="var(--text-2)"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
