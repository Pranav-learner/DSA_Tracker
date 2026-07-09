import { Puzzle } from 'lucide-react';
import { PieChartCard } from '../charts/PieChartCard';
import { BarChartCard } from '../charts/BarChartCard';
import { WidgetLink } from './WidgetLink';
import { useAppSelector } from '@/store/hooks';
import type { ProblemSummary } from '@/types';

/** Problem widget — difficulty distribution (pie or bar per preference) + counts. */
export function ProblemOverviewWidget({ data, loading }: { data?: ProblemSummary; loading?: boolean }) {
  const chartStyle = useAppSelector((s) => s.analytics.distributionChart);
  const slices = (data?.difficultyDistribution ?? []).map((d) => ({ name: d.key, value: d.count }));

  if (chartStyle === 'bar') {
    return (
      <BarChartCard
        title="Problems · Difficulty"
        icon={<Puzzle className="size-4" />}
        action={<WidgetLink to="/analytics/problems" />}
        data={slices.map((s) => ({ name: s.name, count: s.value }))}
        xKey="name"
        dataKey="count"
        name="Solved"
        colorful
        height={240}
        loading={loading}
      />
    );
  }
  return (
    <PieChartCard
      title="Problems · Difficulty"
      icon={<Puzzle className="size-4" />}
      action={<WidgetLink to="/analytics/problems" />}
      data={slices}
      height={240}
      loading={loading}
    />
  );
}
