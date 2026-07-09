import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ANALYTICS_TONE_TEXT, formatDelta, type AnalyticsTone } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  tone?: AnalyticsTone;
  /** Optional period-over-period delta (rendered with an arrow). */
  delta?: number;
  className?: string;
}

/**
 * MetricCard — the atomic analytics figure (label · value · optional icon /
 * hint / delta). The reusable building block for every analytics grid; Sprint 2
 * layers charts beside these, not instead of them.
 */
export function MetricCard({ label, value, icon, hint, tone = 'default', delta, className }: MetricCardProps) {
  return (
    <CardContainer className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon && <span className={cn('text-muted-foreground', tone !== 'default' && ANALYTICS_TONE_TEXT[tone])}>{icon}</span>}
      </div>
      <p className={cn('text-2xl font-semibold leading-none tabular-nums', ANALYTICS_TONE_TEXT[tone])}>{value}</p>
      <div className="flex items-center gap-2">
        {delta !== undefined && delta !== 0 && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', delta > 0 ? 'text-success' : 'text-danger')}>
            {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {formatDelta(delta)}
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </CardContainer>
  );
}
