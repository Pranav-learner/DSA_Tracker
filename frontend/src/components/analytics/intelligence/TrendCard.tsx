import { CardContainer } from '@/components/common/CardContainer';
import { TrendIndicator } from './TrendIndicator';
import { cn } from '@/lib/utils';
import type { Trend } from '@/types';

/** A single metric trend — current value, previous, and direction. */
export function TrendCard({ trend, className }: { trend: Trend; className?: string }) {
  return (
    <CardContainer className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{trend.label}</span>
        <TrendIndicator direction={trend.direction} delta={trend.delta} unit={trend.unit} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          {trend.current}
          {trend.unit}
        </span>
        <span className="text-xs text-muted-foreground">
          from {trend.previous}
          {trend.unit}
        </span>
      </div>
    </CardContainer>
  );
}
