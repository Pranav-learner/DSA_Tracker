import { Lightbulb } from 'lucide-react';
import { useInsights } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { FilterBar, LoadingAnalytics, EmptyAnalytics, IntelInsightCard } from '@/components/analytics';

/** Learning Insights — a dynamically generated, rule-based insights feed. */
export function LearningInsights() {
  const { data, isLoading, isError, error, refetch } = useInsights();

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Pattern Intelligence" title="Learning Insights" description="Auto-generated observations about your learning." icon={<Lightbulb className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={0} panels={4} />
      ) : data.length === 0 ? (
        <EmptyAnalytics title="No insights yet" description="Insights appear as your learning data grows." />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data.map((insight) => (
            <IntelInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
