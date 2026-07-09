import { BarChart3 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { UpcomingCard } from './UpcomingCard';
import { formatMinutes } from '@/lib/revision';
import type { RevisionQueue } from '@/types';

/** Right rail of the revision hub: upcoming reviews + revision statistics. */
export function RevisionSidebar({ queue }: { queue: RevisionQueue }) {
  const { summary } = queue;
  const rows: { label: string; value: string | number }[] = [
    { label: 'Total scheduled', value: summary.totalScheduled },
    { label: 'Due today', value: summary.dueTodayCount },
    { label: 'Overdue', value: summary.overdueCount },
    { label: 'Upcoming (7 days)', value: summary.upcomingCount },
    { label: "Today's est. time", value: formatMinutes(summary.estimatedReviewMinutes) },
  ];

  return (
    <aside className="space-y-4">
      <UpcomingCard items={queue.upcoming} />

      <CardContainer className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <BarChart3 className="size-4" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Revision Statistics
          </h3>
        </div>
        <dl className="space-y-2 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="font-semibold tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
      </CardContainer>
    </aside>
  );
}
