import { TrendingUp, Star, ArrowUpRight, ArrowDownRight, Gauge } from 'lucide-react';
import { useRatingSummary, useRatingHistory } from '@/hooks/useContests';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { AnalyticsGrid } from '@/components/analytics';
import { RatingCard, RatingTimeline, ContestSkeleton, ContestEmptyState, RatingDelta } from '@/components/contest';
import { StatisticsPanel } from '@/components/analytics';
import { formatRatingChange, formatContestDate } from '@/lib/contest';

/** Rating History — rating timeline + change list + highs/lows. */
export function RatingHistory() {
  const summary = useRatingSummary();
  const history = useRatingHistory();

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Competitive Programming" title="Rating History" description="Your rating over every rated contest." icon={<TrendingUp className="size-5" />} />

      {summary.isError ? (
        <ErrorState error={summary.error} onRetry={summary.refetch} />
      ) : summary.isLoading || !summary.data ? (
        <ContestSkeleton variant="grid" rows={4} />
      ) : summary.data.ratedContests === 0 ? (
        <ContestEmptyState title="No rated contests yet" description="Add a rated contest to start your rating timeline." />
      ) : (
        <>
          <AnalyticsGrid cols={4}>
            <RatingCard label="Current" value={summary.data.currentRating ?? '—'} icon={<Gauge className="size-4" />} tone="primary" />
            <RatingCard label="Highest" value={summary.data.highestRating ?? '—'} icon={<Star className="size-4" />} tone="success" />
            <RatingCard label="Best Improvement" value={formatRatingChange(summary.data.bestImprovement)} icon={<ArrowUpRight className="size-4" />} tone="success" />
            <RatingCard label="Worst Drop" value={formatRatingChange(summary.data.worstDrop)} icon={<ArrowDownRight className="size-4" />} tone="danger" />
          </AnalyticsGrid>

          <RatingTimeline history={history.data ?? []} loading={history.isLoading} icon={<TrendingUp className="size-4" />} height={320} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatisticsPanel
              title="Recent rating changes"
              rows={summary.data.recentChanges.map((c) => ({
                label: `${c.contestName} · ${formatContestDate(c.date)}`,
                value: formatRatingChange(c.ratingChange),
                tone: c.ratingChange > 0 ? 'success' : c.ratingChange < 0 ? 'danger' : 'default',
              }))}
            />
            <StatisticsPanel
              title="Rating span"
              rows={[
                { label: 'Current rating', value: summary.data.currentRating ?? '—' },
                { label: 'Highest rating', value: summary.data.highestRating ?? '—', tone: 'success' },
                { label: 'Lowest rating', value: summary.data.lowestRating ?? '—' },
                { label: 'Average rating', value: summary.data.averageRating ?? '—' },
                { label: 'Rated contests', value: summary.data.ratedContests },
              ]}
            />
          </div>

          {history.data && history.data.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Latest: {history.data[history.data.length - 1].contestName} · <RatingDelta change={history.data[history.data.length - 1].ratingChange} />
            </p>
          )}
        </>
      )}
    </div>
  );
}
