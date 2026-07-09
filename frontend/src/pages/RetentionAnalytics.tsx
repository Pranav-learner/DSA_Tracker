import { Brain, HeartPulse, HeartHandshake, Trophy, ShieldAlert, RefreshCw } from 'lucide-react';
import { useRetentionAnalytics } from '@/hooks/useAnalytics';
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

/** Retention analytics — retention, confidence, knowledge health + risk mix. */
export function RetentionAnalytics() {
  const { data, isLoading, isError, error, refetch } = useRetentionAnalytics();

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Analytics" title="Retention" icon={<Brain className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics />
      ) : (
        <>
          <AnalyticsGrid>
            <MetricCard label="Avg Retention" value={`${data.averageRetention}%`} icon={<Brain className="size-4" />} tone="success" />
            <MetricCard label="Avg Confidence" value={`${data.averageConfidence}%`} icon={<HeartHandshake className="size-4" />} tone="primary" />
            <MetricCard label="Knowledge Health" value={`${data.knowledgeHealthPercent}%`} icon={<HeartPulse className="size-4" />} tone="primary" />
            <MetricCard label="Mastered" value={data.masteredTopics} icon={<Trophy className="size-4" />} tone="success" />
            <MetricCard label="Needs Review" value={data.needsReviewTopics} icon={<RefreshCw className="size-4" />} tone={data.needsReviewTopics > 0 ? 'warning' : 'default'} />
            <MetricCard label="At Risk" value={data.atRiskTopics} icon={<ShieldAlert className="size-4" />} tone={data.atRiskTopics > 0 ? 'danger' : 'default'} hint={`${data.totalTracked} tracked`} />
          </AnalyticsGrid>

          <AnalyticsSection title="Health" icon={<HeartPulse className="size-4" />}>
            <PlaceholderChart title="Retention & confidence over time" kind="Timeline" />
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
