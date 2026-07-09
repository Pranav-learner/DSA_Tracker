import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, ListTree, Clock3, FileText, RefreshCw, Lock } from 'lucide-react';
import { useContest, useDeleteContest } from '@/hooks/useContests';
import { ErrorState } from '@/components/common/ErrorState';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { ContestHeader, RatingCard, ContestSkeleton } from '@/components/contest';
import { RatingDelta } from '@/components/contest';
import { formatRatingChange } from '@/lib/contest';

const PLACEHOLDER_SECTIONS = [
  { title: 'Problems', icon: ListTree, note: 'Per-problem tracking arrives in Sprint 2.' },
  { title: 'Timeline', icon: Clock3, note: 'Submission timeline arrives in Sprint 2.' },
  { title: 'Postmortem', icon: FileText, note: 'Contest postmortem arrives in a later sprint.' },
  { title: 'Upsolve', icon: RefreshCw, note: 'The upsolve workflow arrives in a later sprint.' },
];

/** Contest Detail — contest information + placeholders for future sprints. */
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
              <Button variant="ghost" size="sm" onClick={onDelete} disabled={remove.isPending} className="text-danger hover:text-danger">
                <Trash2 className="size-4" /> Delete
              </Button>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PLACEHOLDER_SECTIONS.map(({ title, icon: Icon, note }) => (
              <CardContainer key={title} className="flex items-center gap-3 opacity-70">
                <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-accent text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                    {title} <Lock className="size-3 text-muted-foreground" />
                  </p>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
              </CardContainer>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">Last rated change: {formatRatingChange(data.ratingChange)}</p>
        </>
      )}
    </div>
  );
}
