import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { CalendarDay } from './CalendarDay';
import { cn } from '@/lib/utils';
import type { RevisionCalendar as RevisionCalendarData, RevisionCalendarDay } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface RevisionCalendarProps {
  /** 'YYYY-MM' */
  month: string;
  data: RevisionCalendarData | undefined;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onStepMonth: (delta: number) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Read-only monthly calendar of revision events (overdue / due / upcoming dots). */
export function RevisionCalendar({ month, data, selectedDate, onSelectDate, onStepMonth }: RevisionCalendarProps) {
  const [year, mon] = month.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(year, mon - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const byDate = new Map<string, RevisionCalendarDay>((data?.days ?? []).map((d) => [d.date, d]));
  const today = todayKey();

  const monthLabel = new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="size-4 text-primary" /> {monthLabel}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" onClick={() => onStepMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => onStepMonth(1)} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`b-${i}`} />;
          const date = `${year}-${pad(mon)}-${pad(day)}`;
          return (
            <CalendarDay
              key={date}
              dayNumber={day}
              isToday={date === today}
              isSelected={date === selectedDate}
              data={byDate.get(date)}
              onClick={() => onSelectDate(date)}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <Legend className="bg-danger" label="Overdue" />
        <Legend className="bg-warning" label="Due" />
        <Legend className="bg-primary" label="Upcoming" />
      </div>
    </CardContainer>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', className)} /> {label}
    </span>
  );
}
