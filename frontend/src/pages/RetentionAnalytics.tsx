import { Brain, HeartPulse, HeartHandshake, Trophy, ShieldAlert, RefreshCw } from 'lucide-react';
import { useRetentionAnalytics } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { CardContainer } from '@/components/common/CardContainer';
import {
  AnalyticsSection,
  AnalyticsGrid,
  MetricCard,
  FilterBar,
  LoadingAnalytics,
  PieChartCard,
  ProgressGauge,
  chartColor,
} from '@/components/analytics';

/** Retention analytics — retention, confidence, knowledge health + risk mix. */
export function RetentionAnalytics() {
  const { data, isLoading, isError, error, refetch } = useRetentionAnalytics();
  const mix = data
    ? [
        { name: 'Mastered', value: data.masteredTopics },
        { name: 'Needs Review', value: data.needsReviewTopics },
        { name: 'At Risk', value: data.atRiskTopics },
      ]
    : [];

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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
              <CardContainer className="flex items-center justify-center py-6">
                <ProgressGauge value={data.knowledgeHealthPercent} label="Health" color={chartColor.warning} size={180} />
              </CardContainer>
              <PieChartCard title="Knowledge distribution" data={mix} height={260} />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
