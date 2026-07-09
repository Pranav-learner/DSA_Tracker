import { useSearchParams, Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { useRevisionWorkspace } from '@/hooks/useRevisionSession';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RevisionWorkspace } from '@/components/revision';

/**
 * Revision Workspace page — opened from the queue (`?scheduleId=`) or for a raw
 * entity (`?entityType=&entityId=`). The knowledge content is reused live from
 * Module 2; the session lifecycle runs inside <RevisionWorkspace>.
 */
export function RevisionWorkspacePage() {
  const [params] = useSearchParams();
  const scheduleId = params.get('scheduleId') ?? undefined;
  const entityType = params.get('entityType') ?? undefined;
  const entityId = params.get('entityId') ?? undefined;
  const hasTarget = Boolean(scheduleId || (entityType && entityId));

  const { data, isLoading, isError, error, refetch } = useRevisionWorkspace({ scheduleId, entityType, entityId });

  if (!hasTarget) {
    return (
      <EmptyState
        icon={<CalendarClock className="size-6" />}
        title="Nothing selected to revise"
        description="Open a review from your daily queue to start a session."
        action={
          <Button size="sm" asChild>
            <Link to="/revision">Go to revision hub</Link>
          </Button>
        }
      />
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !data) return <WorkspaceSkeleton />;

  return <RevisionWorkspace workspace={data} />;
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
