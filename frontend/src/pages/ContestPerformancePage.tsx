import { useParams, Link } from 'react-router-dom';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { useContestWorkspace } from '@/hooks/useContestWorkspace';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { AnalyticsSection, PieChartCard } from '@/components/analytics';
import { ContestSkeleton } from '@/components/contest';
import { ContestPerformanceCard, ContestStatisticsGrid } from '@/components/contest/workspace';

/** Contest Performance — the performance metrics + statistics + outcome mix. */
export function ContestPerformancePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useContestWorkspace(id);

  const outcomes = data
    ? [
        { name: 'Solved', value: data.performance.solvedProblems.length },
        { name: 'Unsolved', value: data.performance.unsolvedProblems.length },
        { name: 'Skipped', value: data.performance.skippedProblems.length },
      ].filter((o) => o.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/contests/${id}/workspace`}><ArrowLeft className="size-4" /> Workspace</Link>
      </Button>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <ContestSkeleton variant="grid" rows={6} />
      ) : (
        <>
          <SectionHeader eyebrow="Contest Workspace" title="Performance" description={data.contest.contestName} icon={<BarChart3 className="size-5" />} />
          <AnalyticsSection title="Performance">
            <ContestPerformanceCard performance={data.performance} />
          </AnalyticsSection>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            <AnalyticsSection title="Statistics">
              <ContestStatisticsGrid statistics={data.statistics} />
            </AnalyticsSection>
            <AnalyticsSection title="Outcomes">
              <PieChartCard data={outcomes} height={260} />
            </AnalyticsSection>
          </div>
        </>
      )}
    </div>
  );
}
