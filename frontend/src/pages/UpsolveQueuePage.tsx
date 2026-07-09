import { ListTodo, Clock, CheckCircle2, PlayCircle } from 'lucide-react';
import { useUpsolveQueue } from '@/hooks/useContestLearning';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { AnalyticsGrid, MetricCard } from '@/components/analytics';
import { ContestSkeleton, ContestEmptyState } from '@/components/contest';
import { UpsolveQueue } from '@/components/contest/learning';
import { formatEstimate } from '@/lib/upsolve';

/** Upsolve Queue — the global, cross-contest upsolve backlog. */
export function UpsolveQueuePage() {
  const { data, isLoading, isError, error, refetch } = useUpsolveQueue();
  const all = data ? [...data.pending, ...data.inProgress, ...data.completed, ...data.skipped] : [];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Contest Learning" title="Upsolve Queue" description="Finish what you started — every upsolve feeds your mastery." icon={<ListTodo className="size-5" />} />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <ContestSkeleton variant="grid" rows={4} />
      ) : data.counts.total === 0 ? (
        <ContestEmptyState title="Upsolve queue is empty" description="Generate upsolve tasks from a contest's learning workspace." />
      ) : (
        <>
          <AnalyticsGrid cols={4}>
            <MetricCard label="Pending" value={data.counts.pending} icon={<ListTodo className="size-4" />} tone={data.counts.pending > 0 ? 'warning' : 'default'} />
            <MetricCard label="In Progress" value={data.counts.inProgress} icon={<PlayCircle className="size-4" />} tone="primary" />
            <MetricCard label="Completed" value={data.counts.completed} icon={<CheckCircle2 className="size-4" />} tone="success" />
            <MetricCard label="Est. Remaining" value={formatEstimate(data.estimatedRemainingMinutes)} icon={<Clock className="size-4" />} />
          </AnalyticsGrid>

          <UpsolveQueue tasks={all} title="All upsolve tasks" />
        </>
      )}
    </div>
  );
}
