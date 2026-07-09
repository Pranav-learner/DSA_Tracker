import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ANALYTICS_TONE_TEXT, type AnalyticsTone } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface MetricWidgetProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: AnalyticsTone;
  /** Percentage change vs previous period (drives the trend chip). */
  changePercent?: number;
  changeLabel?: string;
  tooltip?: string;
}

/**
 * MetricWidget — a premium summary metric with an optional period-over-period
 * trend chip. The headline tile of the analytics overview; reusable on Home.
 */
export function MetricWidget({ label, value, icon, tone = 'default', changePercent, changeLabel, tooltip }: MetricWidgetProps) {
  const hasChange = changePercent !== undefined;
  const up = (changePercent ?? 0) > 0;
  const down = (changePercent ?? 0) < 0;
  const TrendIco = up ? TrendingUp : down ? TrendingDown : Minus;

  return (
    <CardContainer className="flex flex-col gap-2">
      <div className="flex items-center justify-between" title={tooltip}>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon && <span className={cn('text-muted-foreground', tone !== 'default' && ANALYTICS_TONE_TEXT[tone])}>{icon}</span>}
      </div>
      <p className={cn('text-2xl font-semibold leading-none tabular-nums', ANALYTICS_TONE_TEXT[tone])}>{value}</p>
      {hasChange ? (
        <span className={cn('inline-flex items-center gap-1 text-xs font-medium', up ? 'text-success' : down ? 'text-danger' : 'text-muted-foreground')}>
          <TrendIco className="size-3" />
          {up ? '+' : ''}
          {changePercent}% {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
        </span>
      ) : (
        changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>
      )}
    </CardContainer>
  );
}
