import { GraduationCap, CheckCircle2, Gauge, Zap, Clock, HeartHandshake, Layers } from 'lucide-react';
import { useLearningAnalytics } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import {
  AnalyticsSection,
  AnalyticsGrid,
  MetricCard,
  FilterBar,
  LoadingAnalytics,
  BarChartCard,
  chartColor,
} from '@/components/analytics';

const short = (s: string) => (s.length > 16 ? `${s.slice(0, 15)}…` : s);

/** Learning analytics — completion, mastery, velocity + per-phase charts. */
export function LearningAnalytics() {
  const { data, isLoading, isError, error, refetch } = useLearningAnalytics();
  const phases = (data?.phaseProgress ?? []).map((p) => ({
    name: short(p.title || p.phaseId),
    completion: p.completionPercent,
    mastery: p.mastery,
  }));

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
              <BarChartCard title="Completion by phase" data={phases} xKey="name" dataKey="completion" name="Completion" color={chartColor.primary} horizontal valueSuffix="%" height={280} />
              <BarChartCard title="Mastery by phase" data={phases} xKey="name" dataKey="mastery" name="Mastery" color={chartColor.success} horizontal valueSuffix="%" height={280} />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
