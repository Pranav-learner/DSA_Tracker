import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Lock, Circle } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import type { RoadmapPhaseState, RoadmapSummaryPhase } from '@/types';

const STATE_META: Record<
  RoadmapPhaseState,
  { label: string; badge: string }
> = {
  completed: { label: 'Completed', badge: 'bg-success/15 text-success' },
  current: { label: 'Current', badge: 'bg-primary/15 text-primary' },
  unlocked: { label: 'Available', badge: 'bg-accent text-muted-foreground' },
  locked: { label: 'Locked', badge: 'bg-muted/40 text-muted-foreground' },
};

/**
 * Compact all-phases roadmap widget. Renders every phase with its state
 * (completed / current / unlocked / locked); clicking a phase opens it in the
 * full Roadmap.
 */
export const RoadmapMiniView = memo(function RoadmapMiniView({
  phases,
}: {
  phases: RoadmapSummaryPhase[];
}) {
  const navigate = useNavigate();

  return (
    <ul className="space-y-1.5">
      {phases.map((phase) => {
        const meta = STATE_META[phase.state];
        const locked = phase.state === 'locked';
        return (
          <li key={phase.phaseId}>
            <button
              type="button"
              onClick={() => navigate(`/roadmap/${phase.phaseId}`)}
              aria-label={`${phase.title} — ${meta.label}`}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2.5 text-left transition-all',
                'hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                locked && 'opacity-60',
                phase.state === 'current' && 'border-primary/40 bg-primary/[0.06]',
              )}
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border"
                style={
                  locked
                    ? undefined
                    : { backgroundColor: `${phase.color}1a`, color: phase.color }
                }
              >
                {phase.state === 'completed' ? (
                  <Check className="size-4 text-success" />
                ) : locked ? (
                  <Lock className="size-3.5 text-muted-foreground" />
                ) : (
                  <Icon name={phase.icon} className="size-4" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  <span className="text-muted-foreground">P{phase.order}</span> · {phase.title}
                </p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {phase.topicsCompleted}/{phase.topicsTotal} topics · {phase.completionPercent}%
                </p>
              </div>

              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  meta.badge,
                )}
              >
                {phase.state === 'current' && <Circle className="mr-1 inline size-2 fill-current" />}
                {meta.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
});
