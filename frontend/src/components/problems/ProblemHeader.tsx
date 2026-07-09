import { Link } from 'react-router-dom';
import { Code2, ExternalLink, BookOpen, Clock, Layers, Hash } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { Button } from '@/components/ui/button';
import { PlatformBadge } from './PlatformBadge';
import { ProblemStatusBadge } from './ProblemStatusBadge';
import { FavoriteButton } from './FavoriteButton';
import { TagChip } from './TagChip';
import { formatHours } from '@/lib/utils';
import type { ProblemDetail } from '@/types';

/** The hero header of the Problem Detail page: identity + metadata + actions. */
export function ProblemHeader({ problem }: { problem: ProblemDetail }) {
  return (
    <CardContainer className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-accent text-primary">
            <Code2 className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{problem.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash className="size-3.5" /> {problem.pattern}
            </p>
          </div>
        </div>
        <FavoriteButton favorite={problem.favorite} className="mt-1" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        <PlatformBadge platform={problem.platform} />
        <ProblemStatusBadge status={problem.status} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> ~{formatHours(problem.estimatedSolveTime / 60)} solve
        </span>
      </div>

      {/* Topic / phase context */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {problem.phase && (
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5" /> Phase {problem.phase.order} · {problem.phase.title}
          </span>
        )}
        {problem.topic && (
          <Link
            to={`/topic/${problem.topic.id}`}
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <BookOpen className="size-3.5" /> {problem.topic.title}
          </Link>
        )}
      </div>

      {problem.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {problem.tags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {problem.url && (
          <Button size="sm" asChild>
            <a href={problem.url} target="_blank" rel="noreferrer">
              Solve on {problem.platform} <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
        {problem.editorialUrl && (
          <Button variant="secondary" size="sm" asChild>
            <a href={problem.editorialUrl} target="_blank" rel="noreferrer">
              <BookOpen className="size-4" /> Editorial
            </a>
          </Button>
        )}
      </div>
    </CardContainer>
  );
}
