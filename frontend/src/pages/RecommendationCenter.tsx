import { Compass } from 'lucide-react';
import { useRecommendations } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { AnalyticsGrid, MetricCard, FilterBar, LoadingAnalytics, EmptyAnalytics, RecommendationCard } from '@/components/analytics';

/** Recommendation Center — actionable, rule-based next steps by priority. */
export function RecommendationCenter() {
  const { data, isLoading, isError, error, refetch } = useRecommendations();
  const byPriority = (p: string) => data?.filter((r) => r.priority === p).length ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Pattern Intelligence" title="Recommendation Center" description="What to do next — prioritised by impact." icon={<Compass className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={3} panels={2} />
      ) : data.length === 0 ? (
        <EmptyAnalytics title="You're all caught up" description="No pressing recommendations — keep up the momentum." />
      ) : (
        <>
          <AnalyticsGrid cols={3}>
            <MetricCard label="High priority" value={byPriority('high')} tone="danger" />
            <MetricCard label="Medium" value={byPriority('medium')} tone="warning" />
            <MetricCard label="Low" value={byPriority('low')} tone="default" />
          </AnalyticsGrid>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.map((r) => (
              <RecommendationCard key={r.id} recommendation={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
