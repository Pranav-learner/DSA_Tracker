import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Compact empty state shown inside a chart body when there's no data. */
export function EmptyChartState({
  message = 'No data for this period',
  height = 220,
  className,
}: {
  message?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-2 text-center text-muted-foreground', className)}
      style={{ minHeight: height }}
    >
      <BarChart3 className="size-6 opacity-50" />
      <p className="text-xs">{message}</p>
    </div>
  );
}
