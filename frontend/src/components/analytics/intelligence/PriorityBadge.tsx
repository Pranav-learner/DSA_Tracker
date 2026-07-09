import { Badge } from '@/components/ui/badge';
import { PRIORITY_META } from '@/lib/intelligence';
import type { Priority } from '@/types';

/** Recommendation/insight priority badge. */
export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const meta = PRIORITY_META[priority];
  return (
    <Badge variant={meta.badge} className={className}>
      {meta.label}
    </Badge>
  );
}
