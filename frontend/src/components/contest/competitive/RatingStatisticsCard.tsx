import { Star, ArrowDownRight, Gauge, TrendingUp, Activity, Swords } from 'lucide-react';
import { AnalyticsGrid, MetricCard } from '@/components/analytics';
import { formatRatingChange } from '@/lib/contest';
import type { RatingAnalysis } from '@/types';

/** Rating statistics grid (highest / lowest / average / gains / consistency). */
export function RatingStatisticsCard({ rating }: { rating: RatingAnalysis }) {
  return (
    <AnalyticsGrid cols={3}>
      <MetricCard label="Highest" value={rating.highestRating ?? '—'} icon={<Star className="size-4" />} tone="success" />
      <MetricCard label="Lowest" value={rating.lowestRating ?? '—'} icon={<ArrowDownRight className="size-4" />} />
      <MetricCard label="Average" value={rating.averageRating ?? '—'} icon={<Gauge className="size-4" />} tone="primary" />
      <MetricCard label="Avg Gain" value={formatRatingChange(rating.averageRatingGain)} icon={<TrendingUp className="size-4" />} tone="success" />
      <MetricCard label="Consistency" value={`${rating.contestConsistency}%`} icon={<Activity className="size-4" />} tone="primary" />
      <MetricCard label="Rated Contests" value={rating.ratedContests} icon={<Swords className="size-4" />} />
    </AnalyticsGrid>
  );
}
