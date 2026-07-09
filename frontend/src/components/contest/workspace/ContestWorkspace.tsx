import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, ListTree, Clock, BarChart3 } from 'lucide-react';
import { useContestWorkspace } from '@/hooks/useContestWorkspace';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { AnalyticsSection } from '@/components/analytics';
import { ContestHeader, ContestSkeleton } from '@/components/contest';
import { ContestWorkspaceSummary } from './ContestWorkspaceSummary';
import { ContestPerformanceCard } from './ContestPerformanceCard';
import { ContestProblemTable } from './ContestProblemTable';
import { ContestTimeline } from './ContestTimeline';
import { ContestStatisticsGrid } from './ContestStatisticsGrid';
import { ContestWorkspaceSidebar } from './ContestWorkspaceSidebar';
import { WorkspaceProblemForm } from './WorkspaceProblemForm';
import { WorkspaceEventForm } from './WorkspaceEventForm';

/**
 * ContestWorkspace — the complete, self-contained contest analysis workspace:
 * header · summary · performance · problems · timeline · statistics · sidebar.
 * Fetches the aggregated workspace and wires problem/timeline mutations.
 */
export function ContestWorkspace({ contestId }: { contestId: string }) {
  const { data, isLoading, isError, error, refetch } = useContestWorkspace(contestId);
  const [addingProblem, setAddingProblem] = useState(false);
  const [loggingEvent, setLoggingEvent] = useState(false);

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !data) return <ContestSkeleton variant="grid" rows={6} />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/contests/${contestId}`}><ArrowLeft className="size-4" /> Contest</Link>
      </Button>

      <ContestHeader
        contest={data.contest}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link to="/contests/library">Library</Link>
          </Button>
        }
      />

      <ContestWorkspaceSummary workspace={data} />

      <AnalyticsSection title="Performance" icon={<BarChart3 className="size-4" />}>
        <ContestPerformanceCard performance={data.performance} />
      </AnalyticsSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <AnalyticsSection
            title="Problems"
            icon={<ListTree className="size-4" />}
            action={
              <Button variant="secondary" size="sm" onClick={() => setAddingProblem((v) => !v)}>
                <Plus className="size-4" /> Add problem
              </Button>
            }
          >
            {addingProblem && <WorkspaceProblemForm contestId={contestId} onDone={() => setAddingProblem(false)} />}
            <ContestProblemTable problems={data.problems} />
          </AnalyticsSection>

          <AnalyticsSection title="Statistics" icon={<BarChart3 className="size-4" />}>
            <ContestStatisticsGrid statistics={data.statistics} />
          </AnalyticsSection>
        </div>

        <div className="space-y-6">
          <ContestWorkspaceSidebar contestId={contestId} performance={data.performance} />
          <ContestTimeline
            events={data.timeline}
            icon={<Clock className="size-4" />}
            action={
              <Button variant="ghost" size="sm" onClick={() => setLoggingEvent((v) => !v)}>
                <Plus className="size-4" /> Log
              </Button>
            }
          />
          {loggingEvent && <WorkspaceEventForm contestId={contestId} onDone={() => setLoggingEvent(false)} />}
        </div>
      </div>
    </div>
  );
}
