import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { MasteryTone } from '@/lib/mastery';

interface DashboardMetricCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  /** Colours the value (reuses the shared mastery tone scale). */
  tone?: MasteryTone;
  className?: string;
}

const TONE_TEXT: Record<MasteryTone, string> = {
  success: 'text-success',
  primary: 'text-primary',
  warning: 'text-warning',
  muted: 'text-foreground',
};

/**
 * Compact metric tile (label · value · optional icon/hint). The dashboard's
 * atomic figure, reused across the progress grid and insights.
 */
export function DashboardMetricCard({
  label,
  value,
  icon,
  hint,
  tone = 'muted',
  className,
}: DashboardMetricCardProps) {
  return (
    <CardContainer className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && <span className={cn('text-muted-foreground', tone !== 'muted' && TONE_TEXT[tone])}>{icon}</span>}
      </div>
      <p className={cn('text-2xl font-semibold leading-none tabular-nums', TONE_TEXT[tone])}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContainer>
  );
}
