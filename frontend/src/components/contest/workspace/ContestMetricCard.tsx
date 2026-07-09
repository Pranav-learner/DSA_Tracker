import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';

const TONE: Record<string, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

/** A compact contest metric tile (performance / statistics grids). */
export function ContestMetricCard({
  label,
  value,
  icon,
  tone = 'default',
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: keyof typeof TONE;
  hint?: string;
  className?: string;
}) {
  return (
    <CardContainer className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon && <span className={cn('text-muted-foreground', tone !== 'default' && TONE[tone])}>{icon}</span>}
      </div>
      <p className={cn('text-2xl font-semibold leading-none tabular-nums', TONE[tone])}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContainer>
  );
}
