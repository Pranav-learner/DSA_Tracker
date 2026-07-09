import { CheckCircle2, XCircle, AlertTriangle, Timer, Zap, Clock, Percent, Gauge } from 'lucide-react';
import { AnalyticsGrid } from '@/components/analytics';
import { ContestMetricCard } from './ContestMetricCard';
import { formatMinutes } from '@/lib/contestWorkspace';
import type { ContestPerformance } from '@/types';

/** Contest performance metrics (solved / wrong / penalty / solve times). */
export function ContestPerformanceCard({ performance }: { performance: ContestPerformance }) {
  return (
    <AnalyticsGrid cols={4}>
      <ContestMetricCard label="Problems Solved" value={performance.totalSolved} icon={<CheckCircle2 className="size-4" />} tone="success" />
      <ContestMetricCard label="Wrong Attempts" value={performance.wrongAttempts} icon={<XCircle className="size-4" />} tone={performance.wrongAttempts > 0 ? 'danger' : 'default'} />
      <ContestMetricCard label="Penalty" value={performance.penalty} icon={<AlertTriangle className="size-4" />} tone={performance.penalty > 0 ? 'warning' : 'default'} />
      <ContestMetricCard label="Success Rate" value={`${performance.problemSuccessRate}%`} icon={<Percent className="size-4" />} tone="primary" />
      <ContestMetricCard label="Avg Solve Time" value={formatMinutes(performance.averageSolveTime)} icon={<Timer className="size-4" />} />
      <ContestMetricCard label="Fastest Solve" value={performance.fastestSolve != null ? formatMinutes(performance.fastestSolve) : '—'} icon={<Zap className="size-4" />} tone="success" />
      <ContestMetricCard label="Slowest Solve" value={performance.slowestSolve != null ? formatMinutes(performance.slowestSolve) : '—'} icon={<Clock className="size-4" />} />
      <ContestMetricCard label="Contest Duration" value={formatMinutes(performance.contestDurationMinutes)} icon={<Gauge className="size-4" />} />
    </AnalyticsGrid>
  );
}
