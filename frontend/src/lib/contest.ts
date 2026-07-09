import type { BadgeProps } from '@/components/ui/badge';
import type { ContestPlatform, ContestType } from '@/types';

/** Per-platform display metadata (badge tint + accent colour for charts). */
export const PLATFORM_META: Record<ContestPlatform, { label: string; badge: NonNullable<BadgeProps['variant']>; color: string }> = {
  Codeforces: { label: 'Codeforces', badge: 'primary', color: 'hsl(245 83% 67%)' },
  LeetCode: { label: 'LeetCode', badge: 'warning', color: 'hsl(38 92% 55%)' },
  AtCoder: { label: 'AtCoder', badge: 'outline', color: 'hsl(190 90% 50%)' },
  CodeChef: { label: 'CodeChef', badge: 'danger', color: 'hsl(24 90% 58%)' },
};

/** Contest-type badge metadata. */
export const CONTEST_TYPE_META: Record<ContestType, { label: string; badge: NonNullable<BadgeProps['variant']> }> = {
  Rated: { label: 'Rated', badge: 'success' },
  Unrated: { label: 'Unrated', badge: 'outline' },
  Virtual: { label: 'Virtual', badge: 'primary' },
};

/** Colour tone for a rating delta. */
export function ratingChangeTone(change: number | null): 'success' | 'danger' | 'muted' {
  if (change === null || change === 0) return 'muted';
  return change > 0 ? 'success' : 'danger';
}

export const RATING_TONE_CLASS: Record<'success' | 'danger' | 'muted', string> = {
  success: 'text-success',
  danger: 'text-danger',
  muted: 'text-muted-foreground',
};

/** Signed rating-change label, e.g. +64, −12, or "—" when not rated. */
export function formatRatingChange(change: number | null): string {
  if (change === null) return '—';
  if (change > 0) return `+${change}`;
  if (change < 0) return `−${Math.abs(change)}`;
  return '0';
}

/** Short contest date, e.g. "Mar 5, 2026". */
export function formatContestDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Duration label, e.g. 120 → "2h", 90 → "1h 30m". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
