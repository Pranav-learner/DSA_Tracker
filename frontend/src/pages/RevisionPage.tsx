import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, AlarmClock, CheckCircle2, CalendarDays, History } from 'lucide-react';
import { useRevisionToday, useRevisionCalendar } from '@/hooks/useRevision';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { stepMonth, selectDate } from '@/store/slices/revisionSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { CardContainer } from '@/components/common/CardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  QueueSummaryCard,
  RevisionQueue,
  RevisionCalendar,
  RevisionSidebar,
  ScheduleChip,
} from '@/components/revision';
import { URGENCY_META, formatShortDate } from '@/lib/revision';
import { cn } from '@/lib/utils';

function monthToRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  return {
    from: new Date(Date.UTC(y, m - 1, 1)).toISOString(),
    to: new Date(Date.UTC(y, m, 0, 23, 59, 59)).toISOString(),
  };
}

export function RevisionPage() {
  const dispatch = useAppDispatch();
  const { calendarMonth, selectedDate } = useAppSelector((s) => s.revision);
  const { data: queue, isLoading, isError, error, refetch } = useRevisionToday();

  const range = useMemo(() => monthToRange(calendarMonth), [calendarMonth]);
  const { data: calendar } = useRevisionCalendar(range);
  const selectedDay = selectedDate ? calendar?.days.find((d) => d.date === selectedDate) : undefined;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Revision Engine"
        title="Daily Revision"
        description="What to revise today — automatically scheduled from your completed topics and knowledge entries."
        icon={<CalendarClock className="size-5" />}
        action={
          <Button variant="secondary" size="sm" asChild>
            <Link to="/revision/history">
              <History className="size-4" /> History
            </Link>
          </Button>
        }
      />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !queue ? (
        <RevisionSkeleton />
      ) : (
        <>
          <QueueSummaryCard summary={queue.summary} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Main */}
            <div className="space-y-6 xl:col-span-2">
              {queue.overdue.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlarmClock className="size-4 text-danger" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Overdue Reviews
                    </h2>
                    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">
                      {queue.overdue.length}
                    </span>
                  </div>
                  <RevisionQueue items={queue.overdue} />
                </section>
              )}

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Today's Queue
                  </h2>
                </div>
                <RevisionQueue
                  items={queue.dueToday}
                  emptyIcon={<CheckCircle2 className="size-6" />}
                  emptyTitle="All caught up for today"
                  emptyDescription="Nothing due right now — check the calendar for what's coming up."
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Calendar
                  </h2>
                </div>
                <RevisionCalendar
                  month={calendarMonth}
                  data={calendar}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => dispatch(selectDate(d))}
                  onStepMonth={(delta) => dispatch(stepMonth(delta))}
                />
                {selectedDay && (
                  <CardContainer className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {formatShortDate(selectedDay.date)} · {selectedDay.total} review{selectedDay.total === 1 ? '' : 's'}
                    </p>
                    <ul className="space-y-1.5">
                      {selectedDay.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm">
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              item.urgency === 'overdue' ? 'bg-danger' : item.urgency === 'due' ? 'bg-warning' : 'bg-primary',
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate">{item.title}</span>
                          <ScheduleChip entityType={item.entityType} />
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {URGENCY_META[item.urgency].label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContainer>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <RevisionSidebar queue={queue} />
          </div>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Retention scoring arrives in the next sprint.{' '}
        <Link to="/problems" className="text-primary hover:underline">
          Keep solving
        </Link>{' '}
        to grow your queue.
      </p>
    </div>
  );
}

function RevisionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <LoadingSkeleton count={3} layout="list" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
