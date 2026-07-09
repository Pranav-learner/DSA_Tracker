import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ScheduleChip } from './ScheduleChip';
import { formatShortDate, revisionEntityLink } from '@/lib/revision';
import type { RevisionSchedule } from '@/types';

/** A compact list of upcoming reviews (next few days). */
export function UpcomingCard({ items }: { items: RevisionSchedule[] }) {
  return (
    <CardContainer className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <CalendarDays className="size-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No upcoming reviews this week.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((s) => (
            <li key={s.id}>
              <Link
                to={revisionEntityLink(s)}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <ScheduleChip entityType={s.entityType} />
                    <span className="text-[11px] text-muted-foreground">{formatShortDate(s.nextReviewDate)}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}
