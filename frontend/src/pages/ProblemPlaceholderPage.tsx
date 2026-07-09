import { useLocation, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Code2, Lock, ExternalLink, Clock } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CardContainer } from '@/components/common/CardContainer';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RepresentativeProblem } from '@/types';

/**
 * Placeholder problem detail. The full Problem Tracker is a future sprint — this
 * page just previews the representative problem (passed via router state) and
 * makes clear the feature is upcoming.
 */
export function ProblemPlaceholderPage() {
  const { topicId, problemId } = useParams<{ topicId: string; problemId: string }>();
  const location = useLocation();
  const problem = (location.state as { problem?: RepresentativeProblem } | null)?.problem;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Roadmap', to: '/roadmap' },
          { label: 'Topic', to: `/topic/${topicId}` },
          { label: problem?.name ?? 'Problem' },
        ]}
      />

      <CardContainer className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-accent text-primary">
              <Code2 className="size-6" />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {problem?.name ?? 'Problem Detail'}
              </h1>
              {problem && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {problem.platform} · Pattern: {problem.pattern}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline">
            <Lock className="size-3" /> Coming soon
          </Badge>
        </div>

        {problem ? (
          <div className="flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={problem.difficulty} />
            <Badge variant="outline">{problem.status}</Badge>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-4" /> ~{problem.estimatedMinutes} min
            </span>
            {problem.url && (
              <Button variant="secondary" size="sm" asChild>
                <a href={problem.url} target="_blank" rel="noreferrer">
                  Open on {problem.platform} <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Open this page from a topic's Representative Problems table to preview a problem.
          </p>
        )}

        <div className="rounded-lg border border-dashed border-border bg-accent/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            The full problem workspace — statement, editor, submissions and progress tracking —
            arrives with the <span className="text-foreground/80">Problem Tracker</span> in a future
            sprint.
          </p>
        </div>

        <Button variant="ghost" size="sm" asChild>
          <Link to={`/topic/${topicId}`}>
            <ArrowLeft className="size-4" /> Back to topic
          </Link>
        </Button>
      </CardContainer>

      {/* Ensure problemId is referenced for clarity in the URL contract. */}
      <p className="sr-only">Problem reference: {problemId}</p>
    </div>
  );
}
