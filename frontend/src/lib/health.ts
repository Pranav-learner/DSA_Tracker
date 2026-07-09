import type { BadgeProps } from '@/components/ui/badge';
import type { RetentionTone } from '@/lib/retention';
import type { HealthStatus, PlanPriority } from '@/types';

/** Visual metadata per health status (tone + label + badge variant). */
export const HEALTH_STATUS_META: Record<
  HealthStatus,
  { label: string; tone: RetentionTone; badge: NonNullable<BadgeProps['variant']> }
> = {
  excellent: { label: 'Excellent', tone: 'success', badge: 'success' },
  good: { label: 'Good', tone: 'primary', badge: 'primary' },
  fair: { label: 'Fair', tone: 'warning', badge: 'warning' },
  'at-risk': { label: 'At Risk', tone: 'danger', badge: 'danger' },
};

/** Visual metadata per today's-plan priority. */
export const PLAN_PRIORITY_META: Record<
  PlanPriority,
  { label: string; badge: NonNullable<BadgeProps['variant']> }
> = {
  high: { label: 'High priority', badge: 'danger' },
  medium: { label: 'Medium priority', badge: 'warning' },
  low: { label: 'Low priority', badge: 'outline' },
};

/** Bar/track colour class per health status. */
export const HEALTH_BAR_CLASS: Record<HealthStatus, string> = {
  excellent: 'bg-success',
  good: 'bg-primary',
  fair: 'bg-warning',
  'at-risk': 'bg-danger',
};
