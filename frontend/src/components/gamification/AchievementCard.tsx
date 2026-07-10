import { Lock, Check } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ChallengeProgressBar } from './ChallengeProgressBar';
import { RARITY_META } from '@/lib/gamification';
import { relativeTime, cn } from '@/lib/utils';
import type { Achievement } from '@/types';

interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
}

/**
 * AchievementCard — one achievement in the grid. Unlocked cards show the rarity
 * glow, icon and unlock date; locked cards dim the icon and show a progress bar
 * toward the goal. Rarity drives the accent colour.
 */
export function AchievementCard({ achievement, className }: AchievementCardProps) {
  const rarity = RARITY_META[achievement.rarity];
  const { unlocked } = achievement;

  return (
    <CardContainer
      className={cn(
        'flex flex-col gap-3 ring-1 transition-all',
        unlocked ? cn(rarity.ring, rarity.glow) : 'ring-transparent',
        !unlocked && 'opacity-80',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex size-12 items-center justify-center rounded-xl text-2xl',
            unlocked ? 'bg-accent' : 'bg-muted/50 grayscale',
          )}
        >
          {unlocked ? achievement.icon : <Lock className="size-5 text-muted-foreground" />}
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', rarity.chip)}>
          {rarity.label}
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{achievement.title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{achievement.description}</p>
      </div>

      {unlocked ? (
        <div className="mt-auto flex items-center gap-1.5 text-xs text-success">
          <Check className="size-3.5" />
          <span>Unlocked {achievement.unlockedAt ? relativeTime(achievement.unlockedAt) : ''}</span>
        </div>
      ) : (
        <div className="mt-auto">
          <ChallengeProgressBar
            value={achievement.progress}
            max={achievement.maxProgress}
            showLabel
            size="sm"
            fillClassName={cn('bg-gradient-to-r from-primary/70 to-primary')}
          />
        </div>
      )}
    </CardContainer>
  );
}
