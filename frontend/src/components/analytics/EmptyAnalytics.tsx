import type { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

/** Graceful empty state for an analytics scope with no data yet. */
export function EmptyAnalytics({
  title = 'No analytics yet',
  description = 'Start learning, solving and revising — your analytics will populate here.',
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return <EmptyState icon={icon ?? <BarChart3 className="size-6" />} title={title} description={description} action={action} />;
}
