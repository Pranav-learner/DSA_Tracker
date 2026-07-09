import { useMemo, type ReactNode } from 'react';
import { LineChartCard } from '@/components/analytics';
import { formatContestDate } from '@/lib/contest';
import { chartColor } from '@/components/analytics/charts';
import type { RatingHistoryPoint } from '@/types';

/**
 * RatingTimeline — the rating progression as a line chart. Reuses the Module 4
 * chart library; each point is a rated contest.
 */
export function RatingTimeline({
  history,
  loading,
  title = 'Rating Timeline',
  icon,
  height = 280,
}: {
  history: RatingHistoryPoint[];
  loading?: boolean;
  title?: string;
  icon?: ReactNode;
  height?: number;
}) {
  const data = useMemo(
    () => history.map((p) => ({ date: formatContestDate(p.date), rating: p.rating })),
    [history],
  );
  return (
    <LineChartCard
      title={title}
      icon={icon}
      data={data}
      xKey="date"
      series={[{ key: 'rating', name: 'Rating', color: chartColor.primary }]}
      height={height}
      loading={loading}
    />
  );
}
