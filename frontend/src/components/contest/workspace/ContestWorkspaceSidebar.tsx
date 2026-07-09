import { Link } from 'react-router-dom';
import { Gauge, Clock, BarChart3, ListTree, GraduationCap, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ContestMetricCard } from './ContestMetricCard';
import { formatMinutes } from '@/lib/contestWorkspace';
import type { ContestPerformance } from '@/types';

/** Workspace sidebar — quick performance glance + section nav + placeholders. */
export function ContestWorkspaceSidebar({ contestId, performance }: { contestId: string; performance: ContestPerformance }) {
  return (
    <aside className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <ContestMetricCard label="Solved" value={performance.totalSolved} icon={<Gauge className="size-4" />} tone="success" />
        <ContestMetricCard label="Penalty" value={performance.penalty} icon={<Clock className="size-4" />} tone={performance.penalty > 0 ? 'warning' : 'default'} />
        <ContestMetricCard label="Avg Solve" value={formatMinutes(performance.averageSolveTime)} icon={<Clock className="size-4" />} />
        <ContestMetricCard label="Success" value={`${performance.problemSuccessRate}%`} icon={<BarChart3 className="size-4" />} tone="primary" />
      </div>

      <CardContainer className="space-y-1">
        <NavRow to={`/contests/${contestId}/learning`} icon={<GraduationCap className="size-4" />} label="Reflect & Upsolve" />
        <NavRow to={`/contests/${contestId}/timeline`} icon={<Clock className="size-4" />} label="Timeline" />
        <NavRow to={`/contests/${contestId}/performance`} icon={<BarChart3 className="size-4" />} label="Performance" />
        <NavRow to={`/contests/${contestId}/problems`} icon={<ListTree className="size-4" />} label="Problem breakdown" />
      </CardContainer>
    </aside>
  );
}

function NavRow({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-card/60">
      <span className="text-primary">{icon}</span>
      {label}
      <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
    </Link>
  );
}
