import type { AnalyticsRange } from '@/types';

/** Selectable trailing-window presets for the DateRangePicker. */
export const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '365d', label: '1Y' },
  { value: 'all', label: 'All' },
];

export type AnalyticsTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

/** Tailwind text colour per analytics tone. */
export const ANALYTICS_TONE_TEXT: Record<AnalyticsTone, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

/** Signed delta label, e.g. 6 → "+6", -4 → "−4". */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '0';
}
