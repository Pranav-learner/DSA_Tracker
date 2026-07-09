import { Link } from 'react-router-dom';
import { CalendarClock, AlarmClock, CalendarDays, CheckCircle2, ArrowRight, PlayCircle } from 'lucide-react';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardGrid } from './DashboardGrid';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { ScheduleChip } from '@/components/revision';
import { reviewCountdown } from '@/lib/revision';
import type { DashboardRevision } from '@/types';

/**
 * Revision Summary — today's queue counts, review completion and a preview of
 * what to revise next, plus a resume hook for any active session. All sourced
 * from the aggregated dashboard payload.
 */
export function RevisionSummaryCard({ revision }: { revision: DashboardRevision }) {
  return (
    <div className="space-y-4">
      {revision.activeSession && (
        <CardContainer className="flex items-center justify-between gap-3 border-warning/40 bg-warning/[0.06]">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-warning">
            <PlayCircle className="size-4" /> Active session · {revision.activeSession.title}
          </span>
          <Link to="/revision/session" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Resume <ArrowRight className="size-3" />
          </Link>
        </CardContainer>
      )}

      <DashboardGrid cols={4}>
        <DashboardMetricCard label="Due Today" value={revision.dueTodayCount} icon={<CalendarClock className="size-4" />} tone={revision.dueTodayCount > 0 ? 'warning' : 'muted'} />
        <DashboardMetricCard label="Overdue" value={revision.overdueCount} icon={<AlarmClock className="size-4" />} tone={revision.overdueCount > 0 ? 'warning' : 'muted'} />
        <DashboardMetricCard label="Upcoming" value={revision.upcomingCount} icon={<CalendarDays className="size-4" />} />
        <DashboardMetricCard label="Done Today" value={revision.completedToday} icon={<CheckCircle2 className="size-4" />} tone="success" />
      </DashboardGrid>

      <CardContainer className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Up Next</h3>
          <Link to="/revision" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Today's queue <ArrowRight className="size-3" />
          </Link>
        </div>
        {revision.preview.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="size-5" />} title="All caught up" description="No reviews waiting right now." />
        ) : (
          <ul className="divide-y divide-border/60">
            {revision.preview.slice(0, 4).map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{s.title}</span>
                <ScheduleChip entityType={s.entityType} />
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {reviewCountdown(s.daysUntilReview)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContainer>
    </div>
  );
}
