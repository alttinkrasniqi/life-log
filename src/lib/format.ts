import type { Metric } from '@/types';

/** Format a value according to metric type and unit */
export function fmtValue(value: number, metric: Metric): string {
  if (metric.type === 'boolean') return value ? 'Yes' : 'No';
  if (metric.type === 'duration') return fmtDuration(value);
  // Decide decimals based on magnitude
  const decimals = pickDecimals(value, metric);
  const num = formatNumber(value, decimals);
  return metric.unit ? `${num} ${metric.unit}` : num;
}

/** Just the numeric portion (no unit) — for big stat displays where unit is rendered separately */
export function fmtValueRaw(value: number, metric: Metric): string {
  if (metric.type === 'boolean') return value ? 'Yes' : 'No';
  if (metric.type === 'duration') return fmtDuration(value, true);
  const decimals = pickDecimals(value, metric);
  return formatNumber(value, decimals);
}

export function fmtDuration(minutes: number, compact = false): string {
  const mins = Math.round(minutes);
  if (mins < 60) return compact ? `${mins}m` : `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return compact ? `${h}h` : `${h} hr`;
  return compact ? `${h}h ${m}m` : `${h} hr ${m} min`;
}

function pickDecimals(value: number, metric: Metric): number {
  if (metric.type === 'count' || metric.type === 'scale') return 0;
  if (metric.type === 'boolean') return 0;
  // For numbers: weight-like values keep 1 decimal, larger keep 0
  const abs = Math.abs(value);
  if (abs === 0) return 0;
  if (abs < 10) return 1;
  if (abs < 100) return value % 1 === 0 ? 0 : 1;
  return 0;
}

function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtDelta(delta: number, decimals = 1): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}${Math.abs(delta).toFixed(decimals)}`;
}

export function fmtPercent(p: number, decimals = 0): string {
  return `${(p * 100).toFixed(decimals)}%`;
}
