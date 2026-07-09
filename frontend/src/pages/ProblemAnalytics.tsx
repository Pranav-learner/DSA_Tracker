import { Puzzle, CheckCircle2, Target, Clock, ListChecks } from 'lucide-react';
import { useProblemAnalytics } from '@/hooks/useAnalytics';
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

/** Problem analytics — solved/attempted, success rate + platform/difficulty mix. */
export function ProblemAnalytics() {
  const { data, isLoading, isError, error, refetch } = useProblemAnalytics();

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
              <StatisticsPanel
                title="Solved by platform"
                rows={
                  data.platformDistribution.length
                    ? data.platformDistribution.map((d) => ({ label: d.key, value: `${d.count} · ${d.percent}%` }))
                    : [{ label: 'No solved problems yet', value: '—' }]
                }
              />
              <StatisticsPanel
                title="Solved by difficulty"
                rows={
                  data.difficultyDistribution.length
                    ? data.difficultyDistribution.map((d) => ({ label: d.key, value: `${d.count} · ${d.percent}%` }))
                    : [{ label: 'No solved problems yet', value: '—' }]
                }
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PlaceholderChart title="Platform distribution" kind="Donut chart" />
              <PlaceholderChart title="Difficulty distribution" kind="Bar chart" />
            </div>
          </AnalyticsSection>
        </>
      )}
    </div>
  );
}
