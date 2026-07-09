import { CalendarClock, AlarmClock, CalendarDays, Clock, ListChecks } from 'lucide-react';
import { DashboardMetricCard } from '@/components/dashboard';
import { formatMinutes } from '@/lib/revision';
import type { RevisionQueueSummary } from '@/types';

/** The revision queue's key figures, as dashboard-style metric cards. */
export function QueueSummaryCard({ summary }: { summary: RevisionQueueSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <DashboardMetricCard
        label="Due Today"
        value={summary.dueTodayCount}
        icon={<CalendarClock className="size-4" />}
        tone={summary.dueTodayCount > 0 ? 'warning' : 'muted'}
      />
      <DashboardMetricCard
        label="Overdue"
        value={summary.overdueCount}
        icon={<AlarmClock className="size-4" />}
        tone={summary.overdueCount > 0 ? 'warning' : 'muted'}
      />
      <DashboardMetricCard
        label="Upcoming"
        value={summary.upcomingCount}
        icon={<CalendarDays className="size-4" />}
      />
      <DashboardMetricCard
        label="Est. Time"
        value={formatMinutes(summary.estimatedReviewMinutes)}
        icon={<Clock className="size-4" />}
      />
      <DashboardMetricCard
        label="Total Scheduled"
        value={summary.totalScheduled}
        icon={<ListChecks className="size-4" />}
      />
    </div>
  );
}
