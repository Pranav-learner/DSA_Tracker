import { Check, Lock } from 'lucide-react';
import { MasteryBar } from './MasteryBar';
import { STAGE_LABELS } from '@/lib/mastery';
import { cn } from '@/lib/utils';
import type { LadderStageProgress } from '@/types';

/** Compact per-stage progress for the six Pattern Ladder stages. */
export function StageProgress({
  ladder,
  className,
}: {
  ladder: LadderStageProgress[];
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {ladder.map((stage) => (
        <div key={stage.stage} className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
              stage.completed
                ? 'border-success/40 bg-success/15 text-success'
                : stage.unlocked
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border bg-accent text-muted-foreground',
            )}
          >
            {stage.completed ? <Check className="size-3" /> : !stage.unlocked ? <Lock className="size-2.5" /> : ''}
          </span>
          <div className="flex-1">
            <MasteryBar value={stage.progress} label={STAGE_LABELS[stage.stage]} />
          </div>
        </div>
      ))}
    </div>
  );
}
