import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProblemWorkspace } from '@/hooks/useWorkspace';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ProblemWorkspace } from '@/components/workspace';

/**
 * Problem Detail is now the integrated **Problem Workspace** — a single
 * aggregated request (`/workspace`) powers the header, learning impact, attempts,
 * notebook, related problems, activity and the learning-summary sidebar. Solving
 * here updates the whole Learning Engine automatically.
 */
export function ProblemDetailPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const { data: workspace, isLoading, isError, error, refetch } = useProblemWorkspace(problemId);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Problem Library', to: '/problems' },
          { label: workspace?.problem.title ?? 'Problem' },
        ]}
      />

      {isLoading && <WorkspaceSkeleton />}
      {isError && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !isError && !workspace && (
        <EmptyState title="Problem not found" description="It may have been removed from the library." />
      )}

      {workspace && (
        <>
          <ProblemWorkspace workspace={workspace} />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/problems">
              <ArrowLeft className="size-4" /> Back to library
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
