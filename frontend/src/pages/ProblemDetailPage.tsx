import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, NotebookPen, AlertTriangle, Gauge } from 'lucide-react';
import { useProblem } from '@/hooks/useProblems';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ProblemHeader, PlaceholderCard } from '@/components/problems';
import { AttemptSummaryCard, AttemptHistory } from '@/components/attempts';

/**
 * Problem Detail — identity + metadata (ProblemHeader), the live Attempt
 * Tracking engine (summary + history), and placeholder cards for the features
 * still to come (Notebook, Mistakes, Confidence — later sprints).
 */
export function ProblemDetailPage() {
  const { problemId } = useParams<{ problemId: string }>();
  const { data: problem, isLoading, isError, error, refetch } = useProblem(problemId);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[{ label: 'Problem Library', to: '/problems' }, { label: problem?.title ?? 'Problem' }]}
      />

      {isLoading && <DetailSkeleton />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {problem && (
        <>
          <ProblemHeader problem={problem} />

          {/* Attempt Tracking Engine (Sprint 2) */}
          <AttemptSummaryCard problemId={problem.id} />
          <AttemptHistory problemId={problem.id} />

          {/* Future workspace features */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PlaceholderCard
                title="Notebook"
                description="Capture your approach, code and key insights."
                icon={<NotebookPen className="size-4" />}
              />
              <PlaceholderCard
                title="Mistakes"
                description="Track recurring mistakes to learn from them."
                icon={<AlertTriangle className="size-4" />}
              />
              <PlaceholderCard
                title="Confidence"
                description="Rate and revisit how confident you feel."
                icon={<Gauge className="size-4" />}
              />
            </div>
          </div>

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

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
