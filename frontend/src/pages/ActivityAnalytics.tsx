import { Activity, Flame, CalendarDays, Zap } from 'lucide-react';
import { useActivityAnalytics } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import {
  AnalyticsSection,
  AnalyticsGrid,
  MetricCard,
  FilterBar,
  LoadingAnalytics,
  ContributionHeatmap,
  TimelineChart,
  AreaChartCard,
  chartColor,
} from '@/components/analytics';

/** Activity analytics — streaks, contribution heatmap + daily/weekly/monthly. */
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

          <AnalyticsSection title="Contribution" icon={<Activity className="size-4" />}>
            <ContributionHeatmap title="Daily activity" icon={<Activity className="size-4" />} data={data.dailyActivity} />
          </AnalyticsSection>

          <AnalyticsSection title="Cadence" icon={<CalendarDays className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AreaChartCard title="Daily activity" data={data.dailyActivity} xKey="date" dataKey="count" name="Events" color={chartColor.primary} height={240} />
              <TimelineChart title="Monthly activity" data={data.monthlyActivity} name="Events" color={chartColor.success} height={240} />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
