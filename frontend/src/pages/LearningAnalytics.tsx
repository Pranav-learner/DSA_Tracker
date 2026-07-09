import { GraduationCap, CheckCircle2, Gauge, Zap, Clock, HeartHandshake, Layers } from 'lucide-react';
import { useLearningAnalytics } from '@/hooks/useAnalytics';
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

/** Learning analytics — completion, mastery, velocity + per-phase breakdown. */
export function LearningAnalytics() {
  const { data, isLoading, isError, error, refetch } = useLearningAnalytics();

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Analytics" title="Learning" icon={<GraduationCap className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics />
      ) : (
        <>
          <AnalyticsGrid>
            <MetricCard label="Completion" value={`${data.completionPercent}%`} icon={<CheckCircle2 className="size-4" />} tone="success" hint={`${data.topicsCompleted}/${data.topicsTotal} topics`} />
            <MetricCard label="Avg Mastery" value={`${data.averageMastery}%`} icon={<Gauge className="size-4" />} tone="primary" />
            <MetricCard label="Velocity" value={`${data.learningVelocityPerWeek}`} icon={<Zap className="size-4" />} hint="topics / week" />
            <MetricCard label="Learning Time" value={`${data.learningTimeHours}h`} icon={<Clock className="size-4" />} />
            <MetricCard label="Avg Confidence" value={`${data.averageConfidence}%`} icon={<HeartHandshake className="size-4" />} tone="primary" />
            <MetricCard label="Topics Remaining" value={data.topicsRemaining} icon={<Layers className="size-4" />} hint={`${data.phasesCompleted}/${data.phasesTotal} phases`} />
          </AnalyticsGrid>

          <AnalyticsSection title="Phase Progress" icon={<Layers className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <StatisticsPanel
                title="Completion by phase"
                rows={data.phaseProgress.map((p) => ({
                  label: p.title || p.phaseId,
                  value: `${p.completionPercent}% · ${p.topicsCompleted}/${p.topicsTotal}`,
                }))}
              />
              <PlaceholderChart title="Mastery progression by phase" kind="Bar chart" />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
