import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ListTree, ArrowLeft, Plus } from 'lucide-react';
import { useContestWorkspace } from '@/hooks/useContestWorkspace';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setProblemStatusFilter } from '@/store/slices/contestSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContestSkeleton } from '@/components/contest';
import { ContestProblemTable, WorkspaceProblemForm } from '@/components/contest/workspace';
import { cn } from '@/lib/utils';

const FILTERS = ['all', 'solved', 'attempted', 'skipped'] as const;

/** Problem Breakdown — the full contest problem table with status filters. */
export function ProblemBreakdownPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const filter = useAppSelector((s) => s.contest.problemStatusFilter);
  const { data, isLoading, isError, error, refetch } = useContestWorkspace(id);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/contests/${id}/workspace`}><ArrowLeft className="size-4" /> Workspace</Link>
      </Button>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <ContestSkeleton rows={6} />
      ) : (
        <>
          <SectionHeader
            eyebrow="Contest Workspace"
            title="Problem Breakdown"
            description={data.contest.contestName}
            icon={<ListTree className="size-5" />}
            action={id && <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)}><Plus className="size-4" /> Add problem</Button>}
          />

          {adding && id && <WorkspaceProblemForm contestId={id} onDone={() => setAdding(false)} />}

          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => dispatch(setProblemStatusFilter(f))} className="focus:outline-none">
                <Badge variant={filter === f ? 'primary' : 'outline'} className={cn('cursor-pointer capitalize')}>{f}</Badge>
              </button>
            ))}
          </div>

          <ContestProblemTable problems={data.problems} statusFilter={filter} />
        </>
      )}
    </div>
  );
}
