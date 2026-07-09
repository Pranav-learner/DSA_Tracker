import { Clock } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn, plural } from '@/lib/utils';

interface EstimatedTimeCardProps {
  hours: number;
  label?: string;
  hint?: string;
  className?: string;
}

/** Compact "estimated learning time" tile, reused across the workspace. */
export function EstimatedTimeCard({
  hours,
  label = 'Estimated Time',
  hint,
  className,
}: EstimatedTimeCardProps) {
  return (
    <CardContainer className={cn('flex items-center gap-3', className)}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-primary">
        <Clock className="size-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{plural(hours, 'hour')}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </CardContainer>
  );
}
