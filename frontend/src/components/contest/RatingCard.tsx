import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';

/** A single rating statistic (current / highest / best improvement …). */
export function RatingCard({
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
  tone?: 'default' | 'success' | 'danger' | 'primary';
  hint?: string;
  className?: string;
}) {
  const toneClass = { default: 'text-foreground', success: 'text-success', danger: 'text-danger', primary: 'text-primary' }[tone];
  return (
    <CardContainer className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon && <span className={cn('text-muted-foreground', tone !== 'default' && toneClass)}>{icon}</span>}
      </div>
      <p className={cn('text-2xl font-semibold leading-none tabular-nums', toneClass)}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContainer>
  );
}
