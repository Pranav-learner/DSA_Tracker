import { LevelCard } from './LevelCard';
import { XPCard } from './XPCard';
import { StreakCard } from './StreakCard';
import { cn } from '@/lib/utils';
import type { ProgressionSummary as ProgressionSummaryData } from '@/types';

interface ProgressionSummaryProps {
  progression: ProgressionSummaryData;
  className?: string;
  /** Compact hides the XP + streak side cards (dashboard rail usage). */
  compact?: boolean;
}

/**
 * ProgressionSummary — the reusable progression hero: the LevelCard beside the
 * XP and Streak cards. Dropped into both the dedicated Progression page and the
 * home dashboard. Pure composition over the smaller reusable cards.
 */
export function ProgressionSummary({ progression, className, compact }: ProgressionSummaryProps) {
  if (compact) {
    return <LevelCard progression={progression} className={className} />;
  }

  return (
    <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-2', className)}>
      <LevelCard progression={progression} className="lg:col-span-2" />
      <XPCard totalXP={progression.totalXP} todaysXP={progression.todaysXP} />
      <StreakCard
        currentStreak={progression.currentStreak}
        longestStreak={progression.longestStreak}
        totalDaysActive={progression.totalDaysActive}
        streakActive={progression.streakActive}
      />
    </div>
  );
}
