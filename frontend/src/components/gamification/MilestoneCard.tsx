import { CardContainer } from '@/components/common/CardContainer';
import { ChallengeProgressBar } from './ChallengeProgressBar';
import { RARITY_META } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/types';

interface MilestoneCardProps {
  /** The next achievement the learner is closest to unlocking. */
  achievement: Achievement;
  className?: string;
}

/**
 * MilestoneCard — highlights an in-progress achievement as the learner's "next
 * milestone", with its icon, remaining count and a progress bar. Used on the
 * profile + dashboard to give a clear next goal.
 */
export function MilestoneCard({ achievement, className }: MilestoneCardProps) {
  const rarity = RARITY_META[achievement.rarity];
  const remaining = Math.max(0, achievement.maxProgress - achievement.progress);

  return (
    <CardContainer className={cn('flex items-center gap-3', className)}>
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-xl">
        {achievement.icon}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{achievement.title}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', rarity.chip)}>
            {rarity.label}
          </span>
        </div>
        <ChallengeProgressBar
          value={achievement.progress}
          max={achievement.maxProgress}
          size="sm"
          fillClassName="bg-gradient-to-r from-primary/70 to-primary"
        />
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {remaining} to go · {achievement.progress}/{achievement.maxProgress}
        </p>
      </div>
    </CardContainer>
  );
}
