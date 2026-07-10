import { ArrowUpRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { LevelProgressRing } from './LevelProgressRing';
import { XPProgressBar } from './XPProgressBar';
import { formatXp } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { ProgressionSummary } from '@/types';

interface LevelCardProps {
  progression: Pick<
    ProgressionSummary,
    'level' | 'tier' | 'currentXP' | 'nextLevelXP' | 'xpRemaining' | 'levelProgress' | 'isMaxLevel'
  >;
  className?: string;
}

/**
 * Level card — the level ring beside the tier name and progress to the next
 * level, with an animated XP bar. The centrepiece of the progression dashboard.
 */
export function LevelCard({ progression, className }: LevelCardProps) {
  const { level, tier, currentXP, nextLevelXP, xpRemaining, levelProgress, isMaxLevel } = progression;

  return (
    <CardContainer className={cn('flex items-center gap-5', className)}>
      <LevelProgressRing level={level} progress={levelProgress} caption={tier} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{tier}</p>
            <p className="text-xs text-muted-foreground">
              {isMaxLevel ? 'Max level reached' : `Level ${level}`}
            </p>
          </div>
          {!isMaxLevel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <ArrowUpRight className="size-3" /> {formatXp(xpRemaining)} to Lv {level + 1}
            </span>
          )}
        </div>
        <XPProgressBar value={currentXP} max={nextLevelXP} showLabel size="md" />
      </div>
    </CardContainer>
  );
}
