import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, Plus } from 'lucide-react';
import { useContestWorkspace } from '@/hooks/useContestWorkspace';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { ContestSkeleton } from '@/components/contest';
import { ContestTimeline, WorkspaceEventForm } from '@/components/contest/workspace';

/** Contest Timeline — the full chronological event stream for a contest. */
export function ContestTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useContestWorkspace(id);
  const [logging, setLogging] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/contests/${id}/workspace`}><ArrowLeft className="size-4" /> Workspace</Link>
      </Button>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <ContestSkeleton variant="grid" rows={2} />
      ) : (
        <>
          <SectionHeader eyebrow="Contest Workspace" title="Timeline" description={data.contest.contestName} icon={<Clock className="size-5" />} action={<Button size="sm" variant="secondary" onClick={() => setLogging((v) => !v)}><Plus className="size-4" /> Log event</Button>} />
          {logging && id && <WorkspaceEventForm contestId={id} onDone={() => setLogging(false)} />}
          <ContestTimeline events={data.timeline} icon={<Clock className="size-4" />} />
        </>
      )}
    </div>
  );
}
