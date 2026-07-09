import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { PlatformBadge } from '@/components/problems';
import { cn } from '@/lib/utils';
import type { RelatedProblemRef } from '@/types';

/** A linked problem — Problem · Pattern · Difficulty · Topic → opens the problem. */
export function RelatedProblemCard({ problem, index = 0 }: { problem: RelatedProblemRef; index?: number }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/problems/${problem.id}`)}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
      className={cn(
        'group flex w-full animate-fade-in flex-col gap-2 rounded-lg border border-border bg-card/60 p-4 text-left shadow-card backdrop-blur-sm transition-all',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 font-semibold leading-tight">{problem.title}</h4>
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="text-xs text-muted-foreground">{problem.pattern}</p>
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        <PlatformBadge platform={problem.platform} />
      </div>
      {problem.topicTitle && (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="size-3.5" /> {problem.topicTitle}
        </p>
      )}
    </button>
  );
}
