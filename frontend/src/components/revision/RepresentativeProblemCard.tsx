import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { PlatformBadge } from '@/components/problems';
import { cn } from '@/lib/utils';
import type { RelatedProblemRef } from '@/types';

/** A compact problem row for the workspace — opens the problem in a new context. */
export function RepresentativeProblemCard({ problem }: { problem: RelatedProblemRef }) {
  return (
    <Link
      to={`/problems/${problem.id}`}
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2.5 transition-colors',
        'hover:border-primary/40 hover:bg-accent/40',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{problem.title}</p>
        <p className="truncate text-xs text-muted-foreground">{problem.pattern}</p>
      </div>
      <DifficultyBadge difficulty={problem.difficulty} />
      <PlatformBadge platform={problem.platform} className="hidden sm:inline-flex" />
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
