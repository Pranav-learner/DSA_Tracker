import { History } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import type { ActivityEvent } from '@/types';

/**
 * ActivityPanel — the connected learning story for this session, newest first
 * (started/solved/documented/mastery/topic-completed/recommendation-changed).
 * Reuses the dashboard's ActivityTimeline so events render identically everywhere.
 */
export function ActivityPanel({ activity }: { activity: ActivityEvent[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Activity Timeline
        </h2>
      </div>
      <CardContainer>
        <ActivityTimeline activities={activity} />
      </CardContainer>
    </div>
  );
}
