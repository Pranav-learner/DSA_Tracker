import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakIndicatorProps {
  streak: number;
  /** Whether the streak is still live (within the grace window). */
  active?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Compact inline streak chip — "🔥 12". The flame glows when the streak is live
 * and greys out once it has lapsed, so the state reads at a glance.
 */
export function StreakIndicator({ streak, active = true, className, size = 'md' }: StreakIndicatorProps) {
  const live = active && streak > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        live ? 'border-warning/30 bg-warning/10 text-warning' : 'border-border bg-muted/40 text-muted-foreground',
        className,
      )}
      title={live ? `${streak}-day learning streak` : 'Streak inactive'}
    >
      <Flame className={cn(size === 'sm' ? 'size-3' : 'size-3.5', live && 'fill-warning/30')} />
      <span className="tabular-nums">{streak}</span>
    </span>
  );
}
