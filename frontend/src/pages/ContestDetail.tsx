import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, ListTree, Clock3, BarChart3, GraduationCap, LayoutGrid, ArrowRight } from 'lucide-react';
import { useContest, useDeleteContest } from '@/hooks/useContests';
import { ErrorState } from '@/components/common/ErrorState';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { ContestHeader, RatingCard, ContestSkeleton } from '@/components/contest';
import { RatingDelta } from '@/components/contest';
import { formatRatingChange } from '@/lib/contest';

/** Contest Detail — contest information + entry into the workspace / learning. */
export function ContestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useContest(id);
  const remove = useDeleteContest();

  const onDelete = () => {
    if (!id || !window.confirm('Delete this contest? Its rating point will be removed too.')) return;
    remove.mutate(id, { onSuccess: () => navigate('/contests/library') });
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/contests/library"><ArrowLeft className="size-4" /> Library</Link>
      </Button>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <ContestSkeleton variant="grid" rows={4} />
      ) : (
        <>
          <ContestHeader
            contest={data}
            actions={
              <>
                <Button asChild size="sm">
                  <Link to={`/contests/${data.id}/workspace`}><LayoutGrid className="size-4" /> Open Workspace</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete} disabled={remove.isPending} className="text-danger hover:text-danger">
                  <Trash2 className="size-4" /> Delete
                </Button>
              </>
            }
          />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <RatingCard label="Rating Before" value={data.ratingBefore ?? '—'} />
            <RatingCard label="Rating After" value={data.ratingAfter ?? '—'} tone="primary" />
            <RatingCard label="Rating Change" value={<RatingDelta change={data.ratingChange} />} tone={data.ratingChange && data.ratingChange > 0 ? 'success' : data.ratingChange && data.ratingChange < 0 ? 'danger' : 'default'} />
            <RatingCard label="Rank" value={data.rank ?? '—'} hint={data.percentile != null ? `top ${100 - data.percentile}%` : undefined} />
          </div>

          {data.notes && (
            <CardContainer className="space-y-1.5">
              <h3 className="text-sm font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground">{data.notes}</p>
            </CardContainer>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { to: `/contests/${data.id}/workspace`, icon: LayoutGrid, label: 'Workspace' },
              { to: `/contests/${data.id}/learning`, icon: GraduationCap, label: 'Reflect & Upsolve' },
              { to: `/contests/${data.id}/problems`, icon: ListTree, label: 'Problems' },
              { to: `/contests/${data.id}/timeline`, icon: Clock3, label: 'Timeline' },
              { to: `/contests/${data.id}/performance`, icon: BarChart3, label: 'Performance' },
            ].map(({ to, icon: Icon, label }) => (
              <Link key={label} to={to}>
                <CardContainer interactive className="flex items-center justify-between gap-2 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-primary" /> {label}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardContainer>
              </Link>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">Last rated change: {formatRatingChange(data.ratingChange)}</p>
        </>
      )}
    </div>
  );
}
