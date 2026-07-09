import { TrendingUp, Gauge, Brain, Zap, NotebookPen, CalendarClock } from 'lucide-react';
import { MetricCard, AnalyticsGrid } from '@/components/analytics';
import type { ExecutiveProgress } from '@/types';

/** Executive progress overview — the headline figures as metric tiles. */
export function ProgressOverview({ progress }: { progress: ExecutiveProgress }) {
  return (
    <AnalyticsGrid cols={3}>
      <MetricCard label="Overall Progress" value={`${progress.completionPercent}%`} icon={<TrendingUp className="size-4" />} tone="primary" />
      <MetricCard label="Overall Mastery" value={`${progress.overallMastery}%`} icon={<Gauge className="size-4" />} tone="primary" />
      <MetricCard label="Overall Retention" value={`${progress.averageRetention}%`} icon={<Brain className="size-4" />} tone="success" />
      <MetricCard label="Learning Velocity" value={`${progress.learningVelocityPerWeek}/wk`} icon={<Zap className="size-4" />} />
      <MetricCard label="Knowledge Coverage" value={`${progress.knowledgeCoveragePercent}%`} icon={<NotebookPen className="size-4" />} />
      <MetricCard label="Revision Health" value={`${progress.revisionConsistencyPercent}%`} icon={<CalendarClock className="size-4" />} tone="primary" />
    </AnalyticsGrid>
  );
}
