import { Link } from 'react-router-dom';
import { Swords, TrendingUp, Trophy, Star, Award, ArrowDownRight, Plus, Library, BarChart3, ArrowRight } from 'lucide-react';
import { useRatingSummary, useContestStats, useContests, useRatingHistory } from '@/hooks/useContests';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { AnalyticsGrid, AnalyticsSection } from '@/components/analytics';
import {
  RatingCard,
  RatingTimeline,
  ContestTable,
  ContestEmptyState,
  ContestSkeleton,
} from '@/components/contest';
import { formatRatingChange } from '@/lib/contest';

/** Contest Dashboard — rating snapshot, quick add, history + rating previews. */
export function ContestDashboard() {
  const rating = useRatingSummary();
  const stats = useContestStats();
  const recent = useContests({ page: 1, pageSize: 5, sort: 'startTime', order: 'desc' });
  const history = useRatingHistory();

  const loading = rating.isLoading || stats.isLoading;
  const empty = stats.data && stats.data.totalContests === 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Competitive Programming"
        title="Contests"
        description="Your rating journey across every platform."
        icon={<Swords className="size-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/contests/library"><Library className="size-4" /> Library</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/contests/new"><Plus className="size-4" /> Add contest</Link>
            </Button>
          </div>
        }
      />

      {rating.isError ? (
        <ErrorState error={rating.error} onRetry={rating.refetch} />
      ) : loading ? (
        <ContestSkeleton variant="grid" rows={6} />
      ) : empty ? (
        <ContestEmptyState action={<Button size="sm" asChild><Link to="/contests/new"><Plus className="size-4" /> Add contest</Link></Button>} />
      ) : (
        <>
          <AnalyticsGrid cols={3}>
            <RatingCard label="Current Rating" value={rating.data?.currentRating ?? '—'} icon={<TrendingUp className="size-4" />} tone="primary" hint={rating.data?.lastRatingChange != null ? `${formatRatingChange(rating.data.lastRatingChange)} last contest` : undefined} />
            <RatingCard label="Highest Rating" value={rating.data?.highestRating ?? '—'} icon={<Star className="size-4" />} tone="success" />
            <RatingCard label="Total Contests" value={stats.data?.totalContests ?? 0} icon={<Swords className="size-4" />} />
            <RatingCard label="Average Rank" value={stats.data?.averageRank || '—'} icon={<Trophy className="size-4" />} />
            <RatingCard label="Best Improvement" value={formatRatingChange(rating.data?.bestImprovement ?? 0)} icon={<Award className="size-4" />} tone="success" />
            <RatingCard label="Worst Drop" value={formatRatingChange(rating.data?.worstDrop ?? 0)} icon={<ArrowDownRight className="size-4" />} tone="danger" />
          </AnalyticsGrid>

          <AnalyticsSection
            title="Rating Progress"
            icon={<TrendingUp className="size-4" />}
            action={<Button variant="link" size="sm" asChild><Link to="/contests/ratings">Full history <ArrowRight className="size-4" /></Link></Button>}
          >
            <RatingTimeline history={history.data ?? []} loading={history.isLoading} />
          </AnalyticsSection>

          <AnalyticsSection
            title="Recent Contests"
            icon={<Swords className="size-4" />}
            action={<Button variant="link" size="sm" asChild><Link to="/contests/library">View all <ArrowRight className="size-4" /></Link></Button>}
          >
            {recent.isLoading ? <ContestSkeleton rows={5} /> : <ContestTable contests={recent.data?.items ?? []} />}
          </AnalyticsSection>

          <p className="text-center">
            <Button variant="link" size="sm" asChild>
              <Link to="/contests/stats"><BarChart3 className="size-4" /> Contest statistics</Link>
            </Button>
          </p>
        </>
      )}
    </div>
  );
}
