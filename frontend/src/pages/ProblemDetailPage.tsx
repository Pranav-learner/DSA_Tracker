import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, NotebookPen, AlertTriangle, Gauge, ArrowRight, BrainCircuit } from 'lucide-react';
import { useProblem } from '@/hooks/useProblems';
import { useNotebookForProblem, useCreateNotebook } from '@/hooks/useNotebook';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CardContainer } from '@/components/common/CardContainer';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ProblemHeader, PlaceholderCard } from '@/components/problems';
import { AttemptSummaryCard, AttemptHistory } from '@/components/attempts';
import { ConfidenceSlider } from '@/components/notebook';

/**
 * Problem Detail — identity + metadata (ProblemHeader), the live Attempt
 * Tracking engine (summary + history), the Pattern Notebook entry point, and
 * placeholder cards for the features still to come (Mistakes, Confidence).
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

          {/* Pattern Notebook entry point (Sprint 3) */}
          <NotebookEntryPoint problemId={problem.id} />

          {/* Future workspace features */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

/**
 * Notebook entry point on the problem page: open the existing entry (with a
 * confidence peek) or document the problem for the first time.
 */
function NotebookEntryPoint({ problemId }: { problemId: string }) {
  const { data: entry, isLoading } = useNotebookForProblem(problemId);
  const createMutation = useCreateNotebook();
  const navigate = useNavigate();

  if (isLoading) return <Skeleton className="h-24 w-full rounded-lg" />;

  const document = () =>
    createMutation.mutate(
      { problemId },
      { onSuccess: (created) => navigate(`/notebook/${created.id}`) },
    );

  return (
    <CardContainer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-primary">
          <BrainCircuit className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold">Pattern Notebook</h3>
          <p className="text-sm text-muted-foreground">
            {entry ? 'Your structured knowledge entry for this problem.' : 'Turn this problem into reusable knowledge.'}
          </p>
        </div>
      </div>

      {entry ? (
        <div className="flex items-center gap-4">
          <div className="w-28">
            <ConfidenceSlider value={entry.confidence} readOnly />
          </div>
          <Button size="sm" asChild>
            <Link to={`/notebook/${entry.id}`}>
              Open notebook <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={document} disabled={createMutation.isPending}>
          <NotebookPen className="size-4" />
          {createMutation.isPending ? 'Creating…' : 'Document this problem'}
        </Button>
      )}
    </CardContainer>
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
