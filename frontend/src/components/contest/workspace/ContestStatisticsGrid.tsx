import { Percent, ListChecks, SkipForward, Repeat, Timer, Gauge, Rocket } from 'lucide-react';
import { AnalyticsGrid } from '@/components/analytics';
import { ContestMetricCard } from './ContestMetricCard';
import { formatMinutes } from '@/lib/contestWorkspace';
import type { ContestStatistics } from '@/types';

/** Derived contest statistics cards (acceptance / pace / efficiency…). */
export function ContestStatisticsGrid({ statistics }: { statistics: ContestStatistics }) {
  return (
    <AnalyticsGrid cols={4}>
      <ContestMetricCard label="Acceptance Rate" value={`${statistics.acceptanceRate}%`} icon={<Percent className="size-4" />} tone="success" />
      <ContestMetricCard label="Attempted" value={statistics.problemsAttempted} icon={<ListChecks className="size-4" />} />
      <ContestMetricCard label="Skipped" value={statistics.problemsSkipped} icon={<SkipForward className="size-4" />} />
      <ContestMetricCard label="Avg Attempts" value={statistics.averageAttempts} icon={<Repeat className="size-4" />} />
      <ContestMetricCard label="Avg Solve Time" value={formatMinutes(statistics.averageSolveTime)} icon={<Timer className="size-4" />} />
      <ContestMetricCard label="Efficiency" value={`${statistics.contestEfficiency}%`} icon={<Gauge className="size-4" />} tone="primary" />
      <ContestMetricCard label="Pace" value={`${statistics.contestPace}/h`} icon={<Rocket className="size-4" />} hint="solved per hour" />
    </AnalyticsGrid>
  );
}
