import { Zap, TrendingUp } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { formatXp } from '@/lib/gamification';
import { cn } from '@/lib/utils';

interface XPCardProps {
  totalXP: number;
  todaysXP: number;
  className?: string;
}

/**
 * XP summary card — lifetime XP headline with today's earnings called out. Pure
 * presentation; every figure comes from the progression API.
 */
export function XPCard({ totalXP, todaysXP, className }: XPCardProps) {
  return (
    <CardContainer className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Zap className="size-3.5" /> Total XP
        </span>
      </div>
      <p className="text-3xl font-bold leading-none tabular-nums">{totalXP.toLocaleString()}</p>
      <div className="flex items-center gap-1.5 text-xs">
        <TrendingUp className={cn('size-3.5', todaysXP > 0 ? 'text-success' : 'text-muted-foreground')} />
        <span className={cn('font-medium tabular-nums', todaysXP > 0 ? 'text-success' : 'text-muted-foreground')}>
          {todaysXP > 0 ? `+${formatXp(todaysXP)} today` : 'No XP yet today'}
        </span>
      </div>
    </CardContainer>
  );
}
