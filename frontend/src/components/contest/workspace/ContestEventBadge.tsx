import { Badge } from '@/components/ui/badge';
import { EVENT_META } from '@/lib/contestWorkspace';
import type { ContestEventType } from '@/types';

/** Timeline-event badge. */
export function ContestEventBadge({ eventType, className }: { eventType: ContestEventType; className?: string }) {
  const meta = EVENT_META[eventType];
  return (
    <Badge variant={meta.badge} className={className}>
      {meta.label}
    </Badge>
  );
}
