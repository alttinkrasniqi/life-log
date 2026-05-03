// =====================================================================
// Core data model — every category/metric is a row in these tables.
// Adding new categories or metrics later requires no code changes.
// =====================================================================

export type MetricType =
  | 'number' // free-form number (calories, weight, $)
  | 'duration' // minutes (study, cardio, deep work)
  | 'count' // integer count (workouts, water glasses)
  | 'boolean' // did/didn't (meditated, journaled)
  | 'scale'; // bounded scale (mood 1-5, focus 1-10)

export type AggregationType =
  | 'sum' // total over period (calories, minutes)
  | 'avg' // average value (weight, mood)
  | 'last' // most recent value (current weight)
  | 'max' // highest in period
  | 'min' // lowest in period
  | 'count'; // number of entries (sessions)

export type Direction = 'up' | 'down'; // is "up" good (study time) or bad (calories)?

export interface Category {
  id: string;
  name: string;
  /** Lucide icon name */
  icon: string;
  /** Hex accent color */
  color: string;
  order: number;
  createdAt: number;
}

export interface Metric {
  id: string;
  categoryId: string;
  name: string;
  /** Display unit, e.g. 'kcal', 'min', 'kg' */
  unit: string;
  type: MetricType;
  aggregation: AggregationType;
  /** For scale type */
  scaleMin?: number;
  scaleMax?: number;
  /** Default value pre-filled in entry modal */
  defaultValue?: number;
  /** Common quick-pick values (e.g. [15, 30, 45, 60] for duration) */
  quickValues?: number[];
  /** Up = improving when higher (study time); Down = improving when lower (calories on a cut) */
  direction: Direction;
  /** Show in Today quick-add bar */
  pinned: boolean;
  order: number;
  createdAt: number;
}

export interface Entry {
  id: string;
  metricId: string;
  /** Numeric storage. Booleans = 0|1. Durations = minutes. Scales = the rating. */
  value: number;
  /** Millisecond epoch — the actual time of the activity */
  timestamp: number;
  note?: string;
  createdAt: number;
}

export interface Target {
  id: string;
  metricId: string;
  period: 'weekly' | 'monthly';
  value: number;
  /** gte = "at least"; lte = "at most" */
  comparator: 'gte' | 'lte';
}

// =====================================================================
// Store shape
// =====================================================================

export interface AppState {
  categories: Record<string, Category>;
  metrics: Record<string, Metric>;
  entries: Record<string, Entry>;
  targets: Record<string, Target>;
  /** Schema version for future migrations */
  schemaVersion: number;
}

// =====================================================================
// Derived / view types
// =====================================================================

export type Period = 'week' | 'month' | 'year' | 'all';

export interface PeriodRange {
  start: number;
  end: number;
}

export interface MetricStats {
  total: number;
  avg: number;
  min: number;
  max: number;
  count: number;
  /** Most recent entry value */
  last: number | null;
  /** Days with at least one entry, in this period */
  activeDays: number;
}

export interface DailyAggregation {
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** Aggregated value for that day, computed per metric.aggregation */
  value: number;
  /** Number of entries that day */
  entryCount: number;
}
