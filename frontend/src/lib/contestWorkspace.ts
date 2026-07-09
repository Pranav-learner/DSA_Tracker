import type { BadgeProps } from '@/components/ui/badge';
import type { ContestEventType, ContestProblemStatus } from '@/types';

/** Per problem-status display metadata. */
export const PROBLEM_STATUS_META: Record<ContestProblemStatus, { label: string; badge: NonNullable<BadgeProps['variant']> }> = {
  solved: { label: 'Solved', badge: 'success' },
  attempted: { label: 'Attempted', badge: 'warning' },
  skipped: { label: 'Skipped', badge: 'outline' },
  unattempted: { label: 'Untouched', badge: 'outline' },
};

/** Per timeline-event display metadata (label + badge + accent). */
export const EVENT_META: Record<ContestEventType, { label: string; badge: NonNullable<BadgeProps['variant']>; dot: string }> = {
  'contest-started': { label: 'Contest Started', badge: 'primary', dot: 'bg-primary' },
  'problem-opened': { label: 'Opened Problem', badge: 'outline', dot: 'bg-muted-foreground' },
  submission: { label: 'Submission', badge: 'primary', dot: 'bg-primary' },
  accepted: { label: 'Accepted', badge: 'success', dot: 'bg-success' },
  'wrong-answer': { label: 'Wrong Answer', badge: 'danger', dot: 'bg-danger' },
  tle: { label: 'Time Limit', badge: 'warning', dot: 'bg-warning' },
  mle: { label: 'Memory Limit', badge: 'warning', dot: 'bg-warning' },
  re: { label: 'Runtime Error', badge: 'warning', dot: 'bg-warning' },
  skipped: { label: 'Skipped', badge: 'outline', dot: 'bg-muted-foreground' },
  'contest-finished': { label: 'Contest Finished', badge: 'success', dot: 'bg-success' },
};

/** Format minutes as a contest clock offset, e.g. 0 → "00:00", 92 → "01:32". */
export function formatOffset(minutes: number | null): string {
  if (minutes === null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Minutes → "5m" / "1h 5m". */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
