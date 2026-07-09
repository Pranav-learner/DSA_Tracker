import { AlarmClock, CalendarClock, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { URGENCY_META } from '@/lib/revision';
import type { RevisionUrgency } from '@/types';

const ICON = { overdue: AlarmClock, due: CalendarClock, upcoming: CalendarDays } as const;

/** Queue-priority badge: Overdue (danger) → Due today (warning) → Upcoming. */
export function PriorityBadge({ urgency, className }: { urgency: RevisionUrgency; className?: string }) {
  const meta = URGENCY_META[urgency];
  const Ico = ICON[urgency];
  return (
    <Badge variant={meta.badge} className={className}>
      <Ico className="size-3" /> {meta.label}
    </Badge>
  );
}
