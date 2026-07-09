import { Puzzle, CheckCircle2, Target, Clock, ListChecks } from 'lucide-react';
import { useProblemAnalytics } from '@/hooks/useAnalytics';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import {
  AnalyticsSection,
  AnalyticsGrid,
  MetricCard,
  FilterBar,
  LoadingAnalytics,
  PieChartCard,
  BarChartCard,
} from '@/components/analytics';

/** Problem analytics — solved/attempted, success rate + platform/difficulty mix. */
export function ProblemAnalytics() {
  const { data, isLoading, isError, error, refetch } = useProblemAnalytics();
  const platform = (data?.platformDistribution ?? []).map((d) => ({ name: d.key, value: d.count }));
  const difficulty = (data?.difficultyDistribution ?? []).map((d) => ({ name: d.key, count: d.count }));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Analytics" title="Problems" icon={<Puzzle className="size-5" />} />
      <FilterBar />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <LoadingAnalytics />
      ) : (
        <>
          <AnalyticsGrid>
            <MetricCard label="Solved" value={data.solvedProblems} icon={<CheckCircle2 className="size-4" />} tone="success" hint={`of ${data.totalProblems} total`} />
            <MetricCard label="Attempted" value={data.attemptedProblems} icon={<ListChecks className="size-4" />} />
            <MetricCard label="Success Rate" value={`${data.successRate}%`} icon={<Target className="size-4" />} tone="primary" />
            <MetricCard label="Avg Solve Time" value={`${data.averageSolveTimeMinutes}m`} icon={<Clock className="size-4" />} />
          </AnalyticsGrid>

          <AnalyticsSection title="Distributions" icon={<Puzzle className="size-4" />}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PieChartCard title="Solved by platform" data={platform} height={280} />
              <BarChartCard title="Solved by difficulty" data={difficulty} xKey="name" dataKey="count" name="Solved" colorful height={280} />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
