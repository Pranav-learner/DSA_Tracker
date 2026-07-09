import { Clock, Repeat, AlertTriangle, ExternalLink } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ContestStatusBadge } from './ContestStatusBadge';
import { formatMinutes } from '@/lib/contestWorkspace';
import { cn } from '@/lib/utils';
import type { ContestProblem } from '@/types';

/** A single contest problem as a card (compact / mobile view). */
export function ContestProblemCard({ problem, className }: { problem: ContestProblem; className?: string }) {
  return (
    <CardContainer className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {problem.index ? `Problem ${problem.index}` : 'Problem'}
            {problem.difficulty && ` · ${problem.difficulty}`}
          </span>
          <h3 className="mt-0.5 truncate font-semibold">
            {problem.problemName}
            {problem.url && (
              <a href={problem.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex text-muted-foreground hover:text-primary" aria-label="Open">
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </h3>
        </div>
        <ContestStatusBadge status={problem.status} />
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Repeat className="size-3.5" /> {problem.attempts} attempts</span>
        {problem.solved && <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" /> {formatMinutes(problem.totalTimeSpent)}</span>}
        {problem.penalty > 0 && <span className="inline-flex items-center gap-1.5 text-warning"><AlertTriangle className="size-3.5" /> {problem.penalty} penalty</span>}
      </div>
    </CardContainer>
  );
}
