import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TREND_META } from '@/lib/intelligence';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { TrendDirection } from '@/types';

const ICON = { increasing: TrendingUp, declining: TrendingDown, stable: Minus } as const;

/** Direction arrow + optional delta for a trend metric. */
export function TrendIndicator({
  direction,
  delta,
  unit = '',
  className,
}: {
  direction: TrendDirection;
  delta?: number;
  unit?: string;
  className?: string;
}) {
  const meta = TREND_META[direction];
  const Ico = ICON[direction];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', ANALYTICS_TONE_TEXT[meta.tone], className)}>
      <Ico className="size-3.5" />
      {delta !== undefined ? `${delta > 0 ? '+' : ''}${delta}${unit}` : meta.label}
    </span>
  );
}
