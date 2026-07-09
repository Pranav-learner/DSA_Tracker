import type { ReactNode } from 'react';
import { ListTodo, Clock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { UpsolveTaskCard } from './UpsolveTaskCard';
import { formatEstimate } from '@/lib/upsolve';
import type { UpsolveTask } from '@/types';

/** The upsolve queue — pending/in-progress tasks first, then completed. */
export function UpsolveQueue({
  tasks,
  contestId,
  title = 'Upsolve Queue',
  icon,
  action,
  emptyDescription = 'No upsolve tasks yet — generate them from the contest workspace.',
}: {
  tasks: UpsolveTask[];
  contestId?: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  emptyDescription?: string;
}) {
  const active = tasks.filter((t) => t.status === 'Pending' || t.status === 'In Progress');
  const done = tasks.filter((t) => t.status === 'Completed' || t.status === 'Skipped');
  const remaining = active.reduce((s, t) => s + t.estimatedTime, 0);

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          {icon ?? <ListTodo className="size-4 text-primary" />} {title}
        </h3>
        <div className="flex items-center gap-3">
          {active.length > 0 && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" /> {formatEstimate(remaining)} left</span>}
          {action}
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={<ListTodo className="size-5" />} title="Nothing to upsolve" description={emptyDescription} />
      ) : (
        <div className="space-y-3">
          {active.map((t) => (
            <UpsolveTaskCard key={t.id} task={t} contestId={contestId} />
          ))}
          {done.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                {done.length} completed / skipped
              </summary>
              <div className="mt-3 space-y-3">
                {done.map((t) => (
                  <UpsolveTaskCard key={t.id} task={t} contestId={contestId} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </CardContainer>
  );
}
