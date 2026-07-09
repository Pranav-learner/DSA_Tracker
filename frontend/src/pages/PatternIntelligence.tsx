import { Brain, Zap, ShieldAlert, Wrench } from 'lucide-react';
import { usePatterns } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import {
  AnalyticsGrid,
  MetricCard,
  FilterBar,
  LoadingAnalytics,
  EmptyAnalytics,
  PatternCard,
} from '@/components/analytics';

/** Pattern Intelligence — every pattern's profile; drill into the matrix. */
export function PatternIntelligence() {
  const { data, isLoading, isError, error, refetch } = usePatterns();
  const strong = data?.filter((p) => p.status === 'strong').length ?? 0;
  const developing = data?.filter((p) => p.status === 'developing').length ?? 0;
  const needsWork = data?.filter((p) => p.status === 'needs-work').length ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Pattern Intelligence" title="Patterns" description="Recognition, implementation, confidence and retention — per pattern." icon={<Brain className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics metrics={3} panels={2} />
      ) : data.length === 0 ? (
        <EmptyAnalytics title="No patterns yet" description="Start learning topics to build pattern intelligence." />
      ) : (
        <>
          <AnalyticsGrid cols={3}>
            <MetricCard label="Strong" value={strong} icon={<Zap className="size-4" />} tone="success" />
            <MetricCard label="Developing" value={developing} icon={<Wrench className="size-4" />} tone="primary" />
            <MetricCard label="Needs Work" value={needsWork} icon={<ShieldAlert className="size-4" />} tone={needsWork > 0 ? 'warning' : 'default'} />
          </AnalyticsGrid>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map((p) => (
              <PatternCard key={p.patternId} pattern={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
