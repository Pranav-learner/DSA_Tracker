import { CardContainer } from '@/components/common/CardContainer';
import { formatDelta } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface ComparisonCardProps {
  label: string;
  current: number;
  previous?: number;
  suffix?: string;
  className?: string;
}

/**
 * ComparisonCard — current vs previous period with a delta. Previous-period data
 * arrives in Sprint 2; until then it degrades gracefully to a single figure with
 * a "comparison coming" note.
 */
export function ComparisonCard({ label, current, previous, suffix = '', className }: ComparisonCardProps) {
  const hasPrev = previous !== undefined;
  const delta = hasPrev ? current - (previous as number) : 0;

  return (
    <CardContainer className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          {current}
          {suffix}
        </span>
        {hasPrev ? (
          <span className={cn('text-xs font-medium', delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-muted-foreground')}>
            {formatDelta(delta)}
            {suffix} vs prev
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/70">comparison in Sprint 2</span>
        )}
      </div>
    </CardContainer>
  );
}
