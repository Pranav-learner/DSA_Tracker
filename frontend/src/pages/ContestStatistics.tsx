import { BarChart3 } from 'lucide-react';
import { useContestStats } from '@/hooks/useContests';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { AnalyticsSection, PieChartCard, BarChartCard } from '@/components/analytics';
import { ContestStatsCard, ContestSkeleton, ContestEmptyState } from '@/components/contest';

/** Contest Statistics — totals + platform distribution + participation. */
export function ContestStatistics() {
  const { data, isLoading, isError, error, refetch } = useContestStats();
  const dist = (data?.platformDistribution ?? []).map((d) => ({ name: d.platform, value: d.count, count: d.count }));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Competitive Programming" title="Contest Statistics" description="Totals, platform mix and participation." icon={<BarChart3 className="size-5" />} />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <ContestSkeleton variant="grid" rows={6} />
      ) : data.totalContests === 0 ? (
        <ContestEmptyState title="No statistics yet" description="Add contests to see your statistics." />
      ) : (
        <>
          <ContestStatsCard stats={data} />

          <AnalyticsSection title="Platform Distribution" icon={<BarChart3 className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PieChartCard title="Contests by platform" data={dist} height={280} />
              <BarChartCard title="Contests by platform" data={dist} xKey="name" dataKey="count" name="Contests" colorful height={280} />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
