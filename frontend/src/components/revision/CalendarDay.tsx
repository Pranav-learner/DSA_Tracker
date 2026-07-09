import { cn } from '@/lib/utils';
import type { RevisionCalendarDay } from '@/types';

interface CalendarDayProps {
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  data?: RevisionCalendarDay;
  onClick: () => void;
}

/** One cell in the revision calendar — day number + urgency dots. */
export function CalendarDay({ dayNumber, isToday, isSelected, data, onClick }: CalendarDayProps) {
  const total = data?.total ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${dayNumber}${total ? ` — ${total} reviews` : ''}`}
      className={cn(
        'flex aspect-square flex-col items-center justify-center gap-1 rounded-md border text-sm transition-colors',
        'border-transparent hover:border-border hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'border-primary/50 bg-primary/[0.08]',
        isToday && !isSelected && 'border-border bg-accent/30',
      )}
    >
      <span className={cn('tabular-nums', isToday ? 'font-semibold text-primary' : 'text-foreground/90')}>
        {dayNumber}
      </span>
      {total > 0 && (
        <span className="flex items-center gap-0.5">
          {data!.overdue > 0 && <Dot className="bg-danger" />}
          {data!.due > 0 && <Dot className="bg-warning" />}
          {data!.upcoming > 0 && <Dot className="bg-primary" />}
        </span>
      )}
    </button>
  );
}

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={cn('size-1.5 rounded-full', className)} />;
}
