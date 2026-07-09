import { CalendarClock, CheckCircle2, AlarmClock, Repeat, Clock, Activity } from 'lucide-react';
import { useRevisionAnalytics } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import {
  AnalyticsSection,
  AnalyticsGrid,
  MetricCard,
  PlaceholderChart,
  FilterBar,
  LoadingAnalytics,
} from '@/components/analytics';

/** Revision analytics — reviews completed, frequency, duration + consistency. */
export function RevisionAnalytics() {
  const { data, isLoading, isError, error, refetch } = useRevisionAnalytics();

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Analytics" title="Revision" icon={<CalendarClock className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics />
      ) : (
        <>
          <AnalyticsGrid>
            <MetricCard label="Reviews Completed" value={data.reviewsCompleted} icon={<CheckCircle2 className="size-4" />} tone="success" />
            <MetricCard label="Overdue" value={data.overdueReviews} icon={<AlarmClock className="size-4" />} tone={data.overdueReviews > 0 ? 'warning' : 'default'} />
            <MetricCard label="Frequency" value={`${data.reviewFrequencyPerWeek}`} icon={<Repeat className="size-4" />} hint="reviews / week" />
            <MetricCard label="Avg Duration" value={`${data.averageReviewDurationMinutes}m`} icon={<Clock className="size-4" />} />
            <MetricCard label="Consistency" value={`${data.revisionConsistencyPercent}%`} icon={<Activity className="size-4" />} tone="primary" />
            <MetricCard label="Total Scheduled" value={data.totalScheduled} icon={<CalendarClock className="size-4" />} />
          </AnalyticsGrid>

          <AnalyticsSection title="Cadence" icon={<CalendarClock className="size-4" />}>
            <PlaceholderChart title="Reviews completed over time" kind="Timeline" />
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
