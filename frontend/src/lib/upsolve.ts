import type { BadgeProps } from '@/components/ui/badge';
import type { UpsolvePriority, UpsolveStatus } from '@/types';

export const UPSOLVE_STATUS_META: Record<UpsolveStatus, { label: string; badge: NonNullable<BadgeProps['variant']> }> = {
  Pending: { label: 'Pending', badge: 'outline' },
  'In Progress': { label: 'In Progress', badge: 'warning' },
  Completed: { label: 'Completed', badge: 'success' },
  Skipped: { label: 'Skipped', badge: 'outline' },
};

export const UPSOLVE_PRIORITY_META: Record<UpsolvePriority, { label: string; badge: NonNullable<BadgeProps['variant']> }> = {
  high: { label: 'High', badge: 'danger' },
  medium: { label: 'Medium', badge: 'warning' },
  low: { label: 'Low', badge: 'outline' },
};

export function formatEstimate(minutes: number): string {
  if (minutes <= 0) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
