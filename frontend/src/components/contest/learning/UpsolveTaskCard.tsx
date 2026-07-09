import { Link } from 'react-router-dom';
import { ExternalLink, NotebookPen, RefreshCw, Clock, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUpdateUpsolve } from '@/hooks/useContestLearning';
import { UPSOLVE_PRIORITY_META, UPSOLVE_STATUS_META, formatEstimate } from '@/lib/upsolve';
import { cn } from '@/lib/utils';
import type { UpsolveTask } from '@/types';

const PRIORITY_BORDER = { high: 'border-l-danger', medium: 'border-l-warning', low: 'border-l-border' } as const;

/** One upsolve task with quick actions (start · complete · open · notebook). */
export function UpsolveTaskCard({ task, contestId, className }: { task: UpsolveTask; contestId?: string; className?: string }) {
  const update = useUpdateUpsolve(contestId ?? task.contestRef);
  const done = task.status === 'Completed';

  return (
    <CardContainer className={cn('flex flex-col gap-3 border-l-4', PRIORITY_BORDER[task.priority], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={UPSOLVE_PRIORITY_META[task.priority].badge}>{UPSOLVE_PRIORITY_META[task.priority].label}</Badge>
            <Badge variant={UPSOLVE_STATUS_META[task.status].badge}>{UPSOLVE_STATUS_META[task.status].label}</Badge>
            {task.pattern && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{task.pattern}</span>}
          </div>
          <h3 className={cn('mt-1 truncate font-semibold', done && 'text-muted-foreground line-through')}>{task.problemName}</h3>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" /> {formatEstimate(task.estimatedTime)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {task.url && (
          <Button asChild size="sm" variant="secondary">
            <a href={task.url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Open</a>
          </Button>
        )}
        {task.linkedKnowledgeEntry && (
          <Button asChild size="sm" variant="ghost">
            <Link to={`/notebook/${task.linkedKnowledgeEntry}`}><NotebookPen className="size-4" /> Notebook</Link>
          </Button>
        )}
        {task.linkedRevisionSchedule && (
          <span className="inline-flex items-center gap-1 text-xs text-success"><RefreshCw className="size-3.5" /> in revision</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!done && task.status !== 'In Progress' && (
            <Button size="sm" variant="ghost" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, patch: { status: 'In Progress' } })}>
              <Play className="size-4" /> Start
            </Button>
          )}
          {!done && (
            <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, patch: { status: 'Completed' } })}>
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Complete
            </Button>
          )}
        </div>
      </div>
      {done && <p className="text-xs text-muted-foreground">Completed — mastery, revision & knowledge synced.</p>}
    </CardContainer>
  );
}
