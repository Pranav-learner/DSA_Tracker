import { TrendingUp } from 'lucide-react';
import { useTrends } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { AnalyticsGrid, FilterBar, LoadingAnalytics, EmptyAnalytics, TrendCard, BarChartCard, chartColor } from '@/components/analytics';

/** Trend Analysis — direction of each headline metric (current vs previous window). */
export function TrendAnalysis() {
  const { data, isLoading, isError, error, refetch } = useTrends();
  const chartData = (data ?? []).map((t) => ({ name: t.label, current: t.current, previous: t.previous }));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Pattern Intelligence" title="Trend Analysis" description="How your metrics are moving vs the previous period." icon={<TrendingUp className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={8} panels={1} />
      ) : data.length === 0 ? (
        <EmptyAnalytics title="No trends yet" description="Trends need at least two periods of data." />
      ) : (
        <>
          <AnalyticsGrid cols={4}>
            {data.map((t) => (
              <TrendCard key={t.key} trend={t} />
            ))}
          </AnalyticsGrid>
          <BarChartCard title="Current vs previous period" data={chartData} xKey="name" dataKey="current" name="Current" color={chartColor.primary} horizontal height={320} />
        </>
      )}
    </div>
  );
}
