import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { selectCoach } from '@/store/slices/aiSlice';
import { actionIcon } from '@/lib/coachIcons';
import { cn } from '@/lib/utils';
import type { MentorAction } from '@/types';

interface ActionButtonGridProps {
  actions: MentorAction[];
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * ActionButtonGrid — a grid of deep-linked mentor actions (Sprint 4). Each button
 * either navigates into the target CP-OS module or switches the active coach. The
 * AI only ever *offers* these — the learner clicks to act; nothing runs
 * automatically.
 */
export function ActionButtonGrid({ actions, columns = 2, className }: ActionButtonGridProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  if (!actions.length) return null;

  const run = (a: MentorAction) => {
    if (a.to) navigate(a.to);
    else if (a.intent) dispatch(selectCoach(a.intent));
  };

  const cols = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={cn('grid gap-2', cols, className)}>
      {actions.map((a) => {
        const Icon = actionIcon(a.kind);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => run(a)}
            className={cn(
              'group flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all active:scale-[0.98]',
              a.primary
                ? 'border-primary/40 bg-primary/12 text-primary hover:bg-primary/20'
                : 'border-border bg-card/60 text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow',
            )}
          >
            <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', a.primary ? 'bg-primary/20 text-primary' : 'bg-accent text-primary')}>
              <Icon className="size-3.5" />
            </span>
            <span className="min-w-0 truncate">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}
