import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  eachDayOfInterval,
  isToday,
  isYesterday,
  formatDistanceToNowStrict,
} from 'date-fns';
import type { Period, PeriodRange } from '@/types';

/** YYYY-MM-DD key, used to bucket entries by day */
export function dayKey(d: Date | number): string {
  return format(d, 'yyyy-MM-dd');
}

export function getPeriodRange(period: Period, ref: Date = new Date()): PeriodRange {
  switch (period) {
    case 'week':
      return {
        start: startOfWeek(ref, { weekStartsOn: 1 }).getTime(),
        end: endOfWeek(ref, { weekStartsOn: 1 }).getTime(),
      };
    case 'month':
      return { start: startOfMonth(ref).getTime(), end: endOfMonth(ref).getTime() };
    case 'year':
      return { start: startOfYear(ref).getTime(), end: endOfYear(ref).getTime() };
    case 'all':
      return { start: 0, end: Date.now() };
  }
}

/** The previous period of equal length, for delta comparisons */
export function getPreviousPeriodRange(period: Period, ref: Date = new Date()): PeriodRange {
  switch (period) {
    case 'week':
      return getPeriodRange('week', subWeeks(ref, 1));
    case 'month':
      return getPeriodRange('month', subMonths(ref, 1));
    case 'year':
      return getPeriodRange('year', subYears(ref, 1));
    case 'all':
      return { start: 0, end: 0 }; // no comparison for all-time
  }
}

export function todayRange(): PeriodRange {
  const now = new Date();
  return { start: startOfDay(now).getTime(), end: endOfDay(now).getTime() };
}

export function lastNDays(n: number): PeriodRange {
  const now = new Date();
  return { start: startOfDay(subDays(now, n - 1)).getTime(), end: endOfDay(now).getTime() };
}

export function eachDayInRange(range: PeriodRange): Date[] {
  return eachDayOfInterval({ start: range.start, end: range.end });
}

export function fmtDate(d: Date | number, pattern = 'EEE, MMM d'): string {
  return format(d, pattern);
}

export function fmtTime(d: Date | number): string {
  return format(d, 'HH:mm');
}

export function fmtRelative(d: Date | number): string {
  const date = typeof d === 'number' ? new Date(d) : d;
  if (isToday(date)) return `Today, ${fmtTime(date)}`;
  if (isYesterday(date)) return `Yesterday, ${fmtTime(date)}`;
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function fmtFullDate(d: Date | number): string {
  return format(d, 'EEEE, MMMM d, yyyy');
}
