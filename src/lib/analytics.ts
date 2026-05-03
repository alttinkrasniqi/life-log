import { startOfDay, differenceInCalendarDays, eachDayOfInterval, subDays } from 'date-fns';
import type {
  AggregationType,
  DailyAggregation,
  Entry,
  Metric,
  MetricStats,
  PeriodRange,
} from '@/types';
import { dayKey } from './date';

// ---------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------

export function entriesForMetric(entries: Entry[], metricId: string): Entry[] {
  return entries.filter((e) => e.metricId === metricId);
}

export function entriesInRange(entries: Entry[], range: PeriodRange): Entry[] {
  return entries.filter((e) => e.timestamp >= range.start && e.timestamp <= range.end);
}

// ---------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------

export function aggregate(values: number[], type: AggregationType): number {
  if (values.length === 0) return 0;
  switch (type) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'last':
      return values[values.length - 1];
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    case 'count':
      return values.length;
  }
}

/**
 * Group entries by day and apply the metric's aggregation per day.
 * Used for charting and for daily totals.
 */
export function dailyAggregations(
  entries: Entry[],
  metric: Metric,
  range: PeriodRange,
  fillEmpty = true,
): DailyAggregation[] {
  const inRange = entriesInRange(entriesForMetric(entries, metric.id), range);
  // Sort by timestamp so aggregation 'last' picks the actual last
  inRange.sort((a, b) => a.timestamp - b.timestamp);

  const buckets = new Map<string, Entry[]>();
  for (const e of inRange) {
    const k = dayKey(e.timestamp);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(e);
  }

  if (fillEmpty) {
    const days = eachDayOfInterval({ start: range.start, end: range.end });
    return days.map((d) => {
      const k = dayKey(d);
      const bucket = buckets.get(k) ?? [];
      return {
        date: k,
        value: bucket.length ? aggregate(bucket.map((e) => e.value), metric.aggregation) : 0,
        entryCount: bucket.length,
      };
    });
  }

  return Array.from(buckets.entries())
    .map(([date, bucket]) => ({
      date,
      value: aggregate(bucket.map((e) => e.value), metric.aggregation),
      entryCount: bucket.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------

export function metricStats(entries: Entry[], metric: Metric, range: PeriodRange): MetricStats {
  const inRange = entriesInRange(entriesForMetric(entries, metric.id), range);
  inRange.sort((a, b) => a.timestamp - b.timestamp);
  const vals = inRange.map((e) => e.value);

  if (vals.length === 0) {
    return { total: 0, avg: 0, min: 0, max: 0, count: 0, last: null, activeDays: 0 };
  }

  const dailyValues = dailyAggregations(entries, metric, range, false).map((d) => d.value);

  return {
    total: vals.reduce((a, b) => a + b, 0),
    avg: dailyValues.length ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0,
    min: Math.min(...vals),
    max: Math.max(...vals),
    count: vals.length,
    last: vals[vals.length - 1],
    activeDays: new Set(inRange.map((e) => dayKey(e.timestamp))).size,
  };
}

/**
 * The "headline" value for a metric in a period — uses the metric's own aggregation
 * so a sum metric gets total, an avg metric gets average, a last metric gets latest.
 */
export function headlineValue(entries: Entry[], metric: Metric, range: PeriodRange): number {
  const inRange = entriesInRange(entriesForMetric(entries, metric.id), range);
  inRange.sort((a, b) => a.timestamp - b.timestamp);
  if (inRange.length === 0) return 0;

  // For 'last' / 'avg' aggregations, work off daily values when there are multiple per day
  if (metric.aggregation === 'avg' || metric.aggregation === 'last') {
    const daily = dailyAggregations(entries, metric, range, false);
    if (daily.length === 0) return 0;
    if (metric.aggregation === 'last') return daily[daily.length - 1].value;
    return daily.reduce((a, b) => a + b.value, 0) / daily.length;
  }

  return aggregate(inRange.map((e) => e.value), metric.aggregation);
}

// ---------------------------------------------------------------------
// Streaks — consecutive days with at least one entry
// ---------------------------------------------------------------------

export interface StreakInfo {
  current: number;
  longest: number;
}

export function streak(entries: Entry[], metricId: string): StreakInfo {
  const dates = new Set(
    entries.filter((e) => e.metricId === metricId).map((e) => dayKey(e.timestamp)),
  );
  if (dates.size === 0) return { current: 0, longest: 0 };

  // Current: walk back from today until a gap
  let current = 0;
  let cursor = startOfDay(new Date());
  // Allow today to be empty without breaking — start counting from yesterday if today is empty
  if (!dates.has(dayKey(cursor))) {
    cursor = subDays(cursor, 1);
  }
  while (dates.has(dayKey(cursor))) {
    current++;
    cursor = subDays(cursor, 1);
  }

  // Longest: sort dates and count consecutive runs
  const sorted = Array.from(dates).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    if (differenceInCalendarDays(curr, prev) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return { current, longest };
}

// ---------------------------------------------------------------------
// Rolling averages — for smoothed trend lines
// ---------------------------------------------------------------------

export function rollingAverage(values: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
}

// ---------------------------------------------------------------------
// Delta — period over period
// ---------------------------------------------------------------------

export interface DeltaInfo {
  absolute: number;
  percent: number; // 0–1, can be negative
  direction: 'up' | 'down' | 'flat';
}

export function delta(current: number, previous: number): DeltaInfo {
  const absolute = current - previous;
  const percent = previous === 0 ? (current === 0 ? 0 : 1) : absolute / Math.abs(previous);
  const direction = absolute > 0.0001 ? 'up' : absolute < -0.0001 ? 'down' : 'flat';
  return { absolute, percent, direction };
}

// ---------------------------------------------------------------------
// Heatmap — last 365 days, intensity 0–1
// ---------------------------------------------------------------------

export interface HeatmapCell {
  date: string;
  value: number;
  /** 0–1, normalized against max in the dataset */
  intensity: number;
}

export function heatmapData(entries: Entry[], metricId: string, days = 365): HeatmapCell[] {
  const range: PeriodRange = {
    start: startOfDay(subDays(new Date(), days - 1)).getTime(),
    end: Date.now(),
  };
  const filtered = entriesInRange(entriesForMetric(entries, metricId), range);

  const buckets = new Map<string, number>();
  for (const e of filtered) {
    const k = dayKey(e.timestamp);
    buckets.set(k, (buckets.get(k) ?? 0) + e.value);
  }

  const max = Math.max(0, ...Array.from(buckets.values()));
  const allDays = eachDayOfInterval({ start: range.start, end: range.end });

  return allDays.map((d) => {
    const k = dayKey(d);
    const v = buckets.get(k) ?? 0;
    return {
      date: k,
      value: v,
      intensity: max === 0 ? 0 : v / max,
    };
  });
}

// ---------------------------------------------------------------------
// Heatmap across an entire CATEGORY — how active was each day overall?
// ---------------------------------------------------------------------

export function categoryHeatmapData(
  entries: Entry[],
  metrics: Metric[],
  categoryId: string,
  days = 365,
): HeatmapCell[] {
  const metricIds = new Set(
    metrics.filter((m) => m.categoryId === categoryId).map((m) => m.id),
  );
  const range: PeriodRange = {
    start: startOfDay(subDays(new Date(), days - 1)).getTime(),
    end: Date.now(),
  };
  const filtered = entries.filter(
    (e) => metricIds.has(e.metricId) && e.timestamp >= range.start && e.timestamp <= range.end,
  );

  // Intensity = number of entries that day (cross-metric activity proxy)
  const buckets = new Map<string, number>();
  for (const e of filtered) {
    const k = dayKey(e.timestamp);
    buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }

  const max = Math.max(0, ...Array.from(buckets.values()));
  const allDays = eachDayOfInterval({ start: range.start, end: range.end });

  return allDays.map((d) => {
    const k = dayKey(d);
    const v = buckets.get(k) ?? 0;
    return {
      date: k,
      value: v,
      intensity: max === 0 ? 0 : v / max,
    };
  });
}

// ---------------------------------------------------------------------
// Consistency score — % of days in the period with at least one entry
// ---------------------------------------------------------------------

export function consistency(entries: Entry[], metricId: string, range: PeriodRange): number {
  const inRange = entriesInRange(entriesForMetric(entries, metricId), range);
  const days = new Set(inRange.map((e) => dayKey(e.timestamp))).size;
  const totalDays = Math.max(1, Math.round((range.end - range.start) / 86_400_000));
  return days / totalDays;
}
