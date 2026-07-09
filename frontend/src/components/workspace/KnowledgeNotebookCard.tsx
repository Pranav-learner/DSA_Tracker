import { useNavigate, Link } from 'react-router-dom';
import { BrainCircuit, NotebookPen, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { ConfidenceSlider } from '@/components/notebook';
import { useCreateNotebook } from '@/hooks/useNotebook';
import type { NotebookRefLite } from '@/types';

/**
 * Knowledge Notebook section on the workspace — open the existing entry (with a
 * confidence peek + metadata status) or document the problem for the first time.
 * Uses the workspace payload, so it needs no extra request.
 */
export function KnowledgeNotebookCard({ notebook, problemId }: { notebook: NotebookRefLite | null; problemId: string }) {
  const navigate = useNavigate();
  const createNotebook = useCreateNotebook();

  const documentProblem = () =>
    createNotebook.mutate({ problemId }, { onSuccess: (entry) => navigate(`/notebook/${entry.id}`) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BrainCircuit className="size-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Knowledge Notebook
        </h2>
      </div>

      <CardContainer className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {notebook ? (
          <>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                Documented as <span className="font-medium text-foreground">{notebook.pattern}</span>
              </p>
              <div className="max-w-xs">
                <ConfidenceSlider value={notebook.confidence} readOnly />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <RotateCcw className="size-3" /> {notebook.revisionCount} reviews
                </span>
                {notebook.hasMetadata && (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="size-3" /> Core metadata complete
                  </span>
                )}
              </div>
            </div>
            <Button size="sm" asChild>
              <Link to={`/notebook/${notebook.id}`}>
                Open notebook <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Turn this problem into reusable knowledge — capture the pattern, key idea and mistakes.
            </p>
            <Button size="sm" onClick={documentProblem} disabled={createNotebook.isPending}>
              <NotebookPen className="size-4" />
              {createNotebook.isPending ? 'Creating…' : 'Document this problem'}
            </Button>
          </>
        )}
      </CardContainer>
    </div>
  );
}
