import type { ReactNode } from 'react';
import { Clock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { TimelineEvent } from './TimelineEvent';
import type { ContestTimelineEvent } from '@/types';

/** The contest timeline — chronological events with a connecting rail. */
export function ContestTimeline({
  events,
  title = 'Contest Timeline',
  icon,
  action,
}: {
  events: ContestTimelineEvent[];
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          {icon ?? <Clock className="size-4 text-primary" />} {title}
        </h3>
        {action}
      </div>
      {events.length === 0 ? (
        <EmptyState icon={<Clock className="size-5" />} title="No events yet" description="Log contest events to build the timeline." />
      ) : (
        <ol className="mt-1">
          {events.map((e, i) => (
            <TimelineEvent key={e.id} event={e} last={i === events.length - 1} />
          ))}
        </ol>
      )}
    </CardContainer>
  );
}
