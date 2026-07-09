import type { BadgeProps } from '@/components/ui/badge';
import type {
  RevisionEntityType,
  RevisionSchedule,
  RevisionSessionStatus,
  RevisionUrgency,
} from '@/types';

/** Visual metadata per queue urgency. */
export const URGENCY_META: Record<
  RevisionUrgency,
  { label: string; badge: NonNullable<BadgeProps['variant']> }
> = {
  overdue: { label: 'Overdue', badge: 'danger' },
  due: { label: 'Due today', badge: 'warning' },
  upcoming: { label: 'Upcoming', badge: 'outline' },
};

/** Human label per entity type. */
export const ENTITY_LABEL: Record<RevisionEntityType, string> = {
  topic: 'Topic',
  pattern: 'Pattern',
  knowledgeEntry: 'Notebook',
};

/** Priority (1–5) → a coarse label + badge for the PriorityBadge. */
export function priorityMeta(priority: number): { label: string; badge: NonNullable<BadgeProps['variant']> } {
  if (priority >= 5) return { label: 'Critical', badge: 'danger' };
  if (priority >= 4) return { label: 'High', badge: 'warning' };
  if (priority >= 3) return { label: 'Medium', badge: 'primary' };
  return { label: 'Low', badge: 'outline' };
}

/** Countdown copy from days-until-review (negative = overdue). */
export function reviewCountdown(daysUntilReview: number): string {
  if (daysUntilReview < 0) {
    const n = Math.abs(daysUntilReview);
    return `Overdue by ${n} ${n === 1 ? 'day' : 'days'}`;
  }
  if (daysUntilReview === 0) return 'Due today';
  if (daysUntilReview === 1) return 'Due tomorrow';
  return `In ${daysUntilReview} days`;
}

/** Compact minutes label, e.g. 8 → "8 min", 75 → "1h 15m". */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Short date label, e.g. "Mar 5". */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Where "Review" opens for a schedule — the Revision Workspace, scoped to the
 * schedule so the learner can start a structured session.
 */
export function revisionEntityLink(schedule: Pick<RevisionSchedule, 'id' | 'entityType' | 'entityId'>): string {
  return `/revision/session?scheduleId=${schedule.id}`;
}

/** Deep link to the workspace for a raw entity (no schedule). */
export function revisionWorkspaceLink(entityType: RevisionEntityType, entityId: string): string {
  return `/revision/session?entityType=${entityType}&entityId=${encodeURIComponent(entityId)}`;
}

/** Badge metadata per session status. */
export const SESSION_STATUS_META: Record<
  RevisionSessionStatus,
  { label: string; badge: NonNullable<BadgeProps['variant']> }
> = {
  Started: { label: 'In Progress', badge: 'warning' },
  Completed: { label: 'Completed', badge: 'success' },
  Abandoned: { label: 'Abandoned', badge: 'outline' },
};

/** Clock label from seconds, e.g. 75 → "1:15", 3725 → "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
