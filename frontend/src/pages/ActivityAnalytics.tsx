import { Activity, Flame, CalendarDays, Zap } from 'lucide-react';
import { useActivityAnalytics } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import {
  AnalyticsSection,
  AnalyticsGrid,
  MetricCard,
  StatisticsPanel,
  PlaceholderChart,
  FilterBar,
  LoadingAnalytics,
} from '@/components/analytics';

/** Activity analytics — streaks, active days + daily/weekly/monthly buckets. */
export function ActivityAnalytics() {
  const { data, isLoading, isError, error, refetch } = useActivityAnalytics();

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Analytics" title="Activity" icon={<Activity className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics />
      ) : (
        <>
          <AnalyticsGrid>
            <MetricCard label="Current Streak" value={`${data.currentStreak}d`} icon={<Flame className="size-4" />} tone="warning" />
            <MetricCard label="Longest Streak" value={`${data.longestStreak}d`} icon={<Flame className="size-4" />} />
            <MetricCard label="Active Days" value={data.activeDays} icon={<CalendarDays className="size-4" />} tone="primary" />
            <MetricCard label="Total Events" value={data.totalActivities} icon={<Zap className="size-4" />} />
          </AnalyticsGrid>

          <AnalyticsSection title="Cadence" description="Contribution calendar arrives in Sprint 2" icon={<Activity className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <StatisticsPanel
                title="Recent months"
                rows={
                  data.monthlyActivity.length
                    ? data.monthlyActivity.slice(-6).map((m) => ({ label: m.date, value: `${m.count} events` }))
                    : [{ label: 'No activity yet', value: '—' }]
                }
              />
              <PlaceholderChart title="Daily activity heatmap" kind="Contribution calendar" />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
