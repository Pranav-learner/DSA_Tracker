import { Flame, Trophy, CalendarCheck } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import { plural } from '@/lib/utils';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  streakActive: boolean;
  className?: string;
}

/**
 * Streak card — the current streak headline (flame glows while live) plus the
 * longest streak and total active days. All values are server-derived.
 */
export function StreakCard({
  currentStreak,
  longestStreak,
  totalDaysActive,
  streakActive,
  className,
}: StreakCardProps) {
  const live = streakActive && currentStreak > 0;

  return (
    <CardContainer className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Current Streak
        </span>
        <Flame className={cn('size-4', live ? 'fill-warning/30 text-warning' : 'text-muted-foreground')} />
      </div>
      <div className="flex items-baseline gap-2">
        <p className={cn('text-3xl font-bold leading-none tabular-nums', live ? 'text-warning' : 'text-foreground')}>
          {currentStreak}
        </p>
        <span className="text-sm text-muted-foreground">{plural(currentStreak, 'day')}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {live
          ? currentStreak <= 1
            ? 'Keep it going tomorrow to build your streak.'
            : "You're on a roll — come back tomorrow."
          : 'Do a learning activity today to start a new streak.'}
      </p>
      <div className="mt-1 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Trophy className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Longest</span>
          <span className="ml-auto font-semibold tabular-nums">{longestStreak}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Active days</span>
          <span className="ml-auto font-semibold tabular-nums">{totalDaysActive}</span>
        </div>
      </div>
    </CardContainer>
  );
}
