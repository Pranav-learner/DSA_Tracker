import { motion } from 'framer-motion';
import { Lock, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PatternStage, LadderStageState } from '@/lib/patternLadder';

interface PatternStageCardProps {
  stage: PatternStage;
  index: number;
  state: LadderStageState;
  active: boolean;
  onToggle: () => void;
  /** Real 0–100 progress (Sprint 3). Falls back to 0/100 by state when omitted. */
  progressValue?: number;
}

/** One rung of the Pattern Ladder. Progress comes from the Learning Engine. */
export function PatternStageCard({
  stage,
  index,
  state,
  active,
  onToggle,
  progressValue,
}: PatternStageCardProps) {
  const locked = state === 'locked';
  const completed = state === 'completed';
  const progress = progressValue ?? (completed ? 100 : 0);

  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'group w-full rounded-lg border bg-card/60 p-4 text-left shadow-card backdrop-blur-sm transition-all',
          'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active ? 'border-primary/50' : 'border-border',
          locked && 'opacity-70',
        )}
        aria-expanded={active}
      >
        <div className="flex items-center gap-3">
          <StageMarker index={index} state={state} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium leading-tight">{stage.title}</h3>
              {locked && <Lock className="size-3.5 text-muted-foreground" />}
              {completed && <Check className="size-3.5 text-success" />}
            </div>
            <p
              className={cn(
                'mt-1 text-sm text-muted-foreground transition-all',
                active ? '' : 'line-clamp-1',
              )}
            >
              {stage.description}
            </p>
          </div>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              active && 'rotate-180',
            )}
          />
        </div>

        {/* Placeholder progress bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
        </div>

        {active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground"
          >
            {locked
              ? 'This stage unlocks as you progress. Unlock logic arrives in Sprint 3.'
              : 'Work through this stage to advance the ladder. Tracking arrives in Sprint 3.'}
          </motion.div>
        )}
      </button>
    </motion.div>
  );
}

function StageMarker({ index, state }: { index: number; state: LadderStageState }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
        state === 'completed' && 'border-success/40 bg-success/15 text-success',
        state === 'available' && 'border-primary/40 bg-primary/15 text-primary',
        state === 'locked' && 'border-border bg-accent text-muted-foreground',
      )}
    >
      {state === 'completed' ? (
        <Check className="size-4" />
      ) : state === 'locked' ? (
        <Lock className="size-3.5" />
      ) : (
        <span>{index + 1}</span>
      )}
    </span>
  );
}
