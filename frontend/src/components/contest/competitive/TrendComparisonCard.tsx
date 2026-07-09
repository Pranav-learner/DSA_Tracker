import { LineChart as LineChartIcon } from 'lucide-react';
import { LineChartCard } from '@/components/analytics';
import type { RatingAnalysis } from '@/types';

/** Rating trend over time — the timeline of rated-contest results. */
export function TrendComparisonCard({ rating, height = 240 }: { rating: RatingAnalysis; height?: number }) {
  const data = rating.timeline.map((p) => ({ date: p.date.slice(0, 10), rating: p.rating }));
  return (
    <LineChartCard
      title="Rating Trend"
      icon={<LineChartIcon className="size-4 text-primary" />}
      data={data}
      xKey="date"
      series={[{ key: 'rating', name: 'Rating' }]}
      height={height}
    />
  );
}
