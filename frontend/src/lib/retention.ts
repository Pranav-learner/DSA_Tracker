import type { BadgeProps } from '@/components/ui/badge';
import type { ConfidenceTrendDirection, RetentionLevel } from '@/types';

/** Retention tone scale — the mastery scale plus a `danger` step for At Risk. */
export type RetentionTone = 'muted' | 'warning' | 'primary' | 'success' | 'danger';

/** Tailwind text colour per retention tone. */
export const RETENTION_TONE_TEXT: Record<RetentionTone, string> = {
  muted: 'text-foreground',
  warning: 'text-warning',
  primary: 'text-primary',
  success: 'text-success',
  danger: 'text-danger',
};

/** Visual metadata per retention level (badge variant + tone + blurb). */
export const RETENTION_LEVEL_META: Record<
  RetentionLevel,
  { badge: NonNullable<BadgeProps['variant']>; tone: RetentionTone; description: string }
> = {
  Mastered: { badge: 'success', tone: 'success', description: 'Deeply retained — reviews stay light.' },
  Strong: { badge: 'primary', tone: 'primary', description: 'Solid recall with room to consolidate.' },
  Familiar: { badge: 'primary', tone: 'primary', description: 'Recognised, but not yet automatic.' },
  Learning: { badge: 'outline', tone: 'muted', description: 'Still building the core memory.' },
  'Needs Review': { badge: 'warning', tone: 'warning', description: 'Due for a refresh to hold retention.' },
  'At Risk': { badge: 'danger', tone: 'danger', description: 'Fading fast — revise soon.' },
};

/** Trend metadata: label + colour tone per confidence-trend direction. */
export const CONFIDENCE_TREND_META: Record<
  ConfidenceTrendDirection,
  { label: string; tone: RetentionTone }
> = {
  rising: { label: 'Rising', tone: 'success' },
  falling: { label: 'Falling', tone: 'danger' },
  stable: { label: 'Stable', tone: 'muted' },
};

/** Map a 0–100 score to the retention tone scale. */
export function scoreTone(score: number): RetentionTone {
  if (score >= 80) return 'success';
  if (score >= 60) return 'primary';
  if (score >= 40) return 'warning';
  return 'danger';
}

/** CSS colour (hsl var) per retention tone — for SVG strokes. */
export const RETENTION_TONE_COLOR: Record<RetentionTone, string> = {
  muted: 'hsl(var(--muted-foreground))',
  warning: 'hsl(var(--warning))',
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  danger: 'hsl(var(--danger))',
};

/** SVG stroke colour for a 0–100 score. */
export function scoreColor(score: number): string {
  return RETENTION_TONE_COLOR[scoreTone(score)];
}

/** Signed delta label, e.g. 6 → "+6", -4 → "-4", 0 → "0". */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

/** Countdown copy from days-until-review (null = unscheduled, negative = overdue). */
export function nextReviewLabel(daysUntilReview: number | null): string {
  if (daysUntilReview === null) return 'Not scheduled';
  if (daysUntilReview < 0) {
    const n = Math.abs(daysUntilReview);
    return `Overdue by ${n} ${n === 1 ? 'day' : 'days'}`;
  }
  if (daysUntilReview === 0) return 'Due today';
  if (daysUntilReview === 1) return 'Due tomorrow';
  return `In ${daysUntilReview} days`;
}
