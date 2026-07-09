import type { ReactNode } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleComparison } from '@/store/slices/analyticsSlice';
import { cn } from '@/lib/utils';

/**
 * FilterBar — the analytics toolbar: date range + comparison toggle + any
 * page-specific controls passed as children. Comparison is a UI flag now;
 * Sprint 2 wires it to period-over-period deltas.
 */
export function FilterBar({ children, className }: { children?: ReactNode; className?: string }) {
  const dispatch = useAppDispatch();
  const comparison = useAppSelector((s) => s.analytics.comparison);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/40 p-3', className)}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={comparison}
          onClick={() => dispatch(toggleComparison())}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
            comparison ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          <GitCompareArrows className="size-3.5" /> Compare
        </button>
        <DateRangePicker />
      </div>
    </div>
  );
}
