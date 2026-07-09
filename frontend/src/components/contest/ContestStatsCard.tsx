import { Swords, Star, Ghost, Trophy, TrendingUp, CalendarClock } from 'lucide-react';
import { MetricCard, AnalyticsGrid } from '@/components/analytics';
import { formatRatingChange } from '@/lib/contest';
import type { ContestStats } from '@/types';

/** Contest statistics as a grid of metric tiles. */
export function ContestStatsCard({ stats }: { stats: ContestStats }) {
  return (
    <AnalyticsGrid cols={3}>
      <MetricCard label="Total Contests" value={stats.totalContests} icon={<Swords className="size-4" />} tone="primary" />
      <MetricCard label="Rated" value={stats.ratedContests} icon={<Star className="size-4" />} tone="success" />
      <MetricCard label="Virtual" value={stats.virtualContests} icon={<Ghost className="size-4" />} />
      <MetricCard label="Average Rank" value={stats.averageRank || '—'} icon={<Trophy className="size-4" />} />
      <MetricCard label="Avg Rating Δ" value={formatRatingChange(stats.averageRatingChange)} icon={<TrendingUp className="size-4" />} tone={stats.averageRatingChange >= 0 ? 'success' : 'danger'} />
      <MetricCard label="Frequency" value={`${stats.participationFrequencyPerMonth}/mo`} icon={<CalendarClock className="size-4" />} />
    </AnalyticsGrid>
  );
}
