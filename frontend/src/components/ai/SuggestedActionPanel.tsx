import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { selectCoach } from '@/store/slices/aiSlice';
import { actionIcon } from '@/lib/coachIcons';
import { cn } from '@/lib/utils';
import type { CoachAction } from '@/types';

interface SuggestedActionPanelProps {
  actions: CoachAction[];
  className?: string;
}

/**
 * SuggestedActionPanel — the actionable buttons a coach attaches to its response.
 * Each action either deep-links into the relevant CP-OS module (revision,
 * notebook, a topic, upsolve …) or, when it carries an `intent`, switches the
 * active coach. This is what turns advice into one-tap next steps.
 */
export function SuggestedActionPanel({ actions, className }: SuggestedActionPanelProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  if (!actions.length) return null;

  const run = (a: CoachAction) => {
    if (a.to) navigate(a.to);
    else if (a.intent) dispatch(selectCoach(a.intent));
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((a) => {
        const Icon = actionIcon(a.kind);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => run(a)}
            className={cn(
              'group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all active:scale-95',
              a.primary
                ? 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25'
                : 'border-border bg-card/60 text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow',
            )}
          >
            <Icon className="size-3.5" />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
