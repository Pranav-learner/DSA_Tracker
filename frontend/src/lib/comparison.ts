import type { AnalyticsRangeSelection } from '@/store/slices/analyticsSlice';

const DAY_MS = 86_400_000;

/** Trailing days for each preset range (null = not comparable). */
const RANGE_DAYS: Record<string, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '365d': 365,
  all: null,
  custom: null,
};

/**
 * The immediately-preceding window of equal length, for period-over-period
 * comparison. Returns null when the range isn't comparable (all / custom).
 * Consumes the existing analytics API via its `from`/`to` params — no new
 * backend algorithm is introduced.
 */
export function previousWindow(range: AnalyticsRangeSelection): { from: string; to: string } | null {
  const days = RANGE_DAYS[range];
  if (!days) return null;
  const now = Date.now();
  const to = new Date(now - days * DAY_MS);
  const from = new Date(now - 2 * days * DAY_MS);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Human label for the current-vs-previous comparison. */
export function comparisonLabel(range: AnalyticsRangeSelection): string {
  switch (range) {
    case '7d':
      return 'vs previous week';
    case '30d':
      return 'vs previous month';
    case '90d':
      return 'vs previous quarter';
    default:
      return 'vs previous period';
  }
}

/** Absolute delta between two figures. */
export function delta(current: number, previous: number): number {
  return Math.round((current - previous) * 10) / 10;
}

/** Percentage change from previous to current (0 when previous is 0). */
export function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
