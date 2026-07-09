import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRange } from '@/store/slices/analyticsSlice';
import { RANGE_OPTIONS } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/**
 * DateRangePicker — trailing-window preset selector wired to the shared analytics
 * UI state. Every analytics query reads the same range, so switching here
 * refetches all scopes consistently.
 */
export function DateRangePicker({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const range = useAppSelector((s) => s.analytics.range);

  return (
    <div
      role="group"
      aria-label="Select analytics date range"
      className={cn('inline-flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1', className)}
    >
      {RANGE_OPTIONS.map((opt) => {
        const active = range === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => dispatch(setRange(opt.value))}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
