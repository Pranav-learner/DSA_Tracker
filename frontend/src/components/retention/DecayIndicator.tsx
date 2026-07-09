import { TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DecayIndicatorProps {
  /** Current daily decay rate (confidence points lost per day). */
  decayScore: number;
  className?: string;
}

/**
 * Shows how fast an entity is currently forgetting. A higher daily decay reads
 * as more urgent; well-reviewed entities decay slowly.
 */
export function DecayIndicator({ decayScore, className }: DecayIndicatorProps) {
  const rate = Math.max(0, decayScore);
  const tone = rate >= 1.5 ? 'text-danger' : rate >= 0.8 ? 'text-warning' : 'text-muted-foreground';
  const label = rate >= 1.5 ? 'Fast decay' : rate >= 0.8 ? 'Moderate decay' : 'Slow decay';

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', tone, className)} title={label}>
      <TrendingDown className="size-3.5" />
      <span className="tabular-nums">-{rate.toFixed(1)}/day</span>
      <span className="text-muted-foreground">· {label}</span>
    </span>
  );
}
