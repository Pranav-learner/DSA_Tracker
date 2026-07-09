import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, NotebookPen, ArrowRight, Loader2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { ProblemStatusBadge } from '@/components/problems';
import { useCompleteProblem } from '@/hooks/useWorkspace';
import { useCreateNotebook } from '@/hooks/useNotebook';
import type { NotebookRefLite, ProblemDetail, ProblemLearningStatus } from '@/types';

/**
 * QuickActionBar — the workspace's primary actions: mark solved (runs the full
 * integration flow), open/create the notebook, and the live learning status.
 */
export function QuickActionBar({
  problem,
  status,
  notebook,
}: {
  problem: ProblemDetail;
  status: ProblemLearningStatus;
  notebook: NotebookRefLite | null;
}) {
  const navigate = useNavigate();
  const complete = useCompleteProblem(problem.id);
  const createNotebook = useCreateNotebook();
  const isSolved = status === 'Solved' || status === 'Mastered';

  const documentProblem = () =>
    createNotebook.mutate(
      { problemId: problem.id },
      { onSuccess: (entry) => navigate(`/notebook/${entry.id}`) },
    );

  return (
    <CardContainer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Status</span>
        <ProblemStatusBadge status={status} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => complete.mutate(undefined)} disabled={isSolved || complete.isPending}>
          {complete.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {isSolved ? 'Solved' : complete.isPending ? 'Solving…' : 'Mark Solved'}
        </Button>

        {notebook ? (
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/notebook/${notebook.id}`}>
              <NotebookPen className="size-4" /> Open notebook
            </Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={documentProblem} disabled={createNotebook.isPending}>
            <NotebookPen className="size-4" />
            {createNotebook.isPending ? 'Creating…' : 'Document'}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </CardContainer>
  );
}
