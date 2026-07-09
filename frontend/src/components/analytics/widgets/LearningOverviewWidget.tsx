import { GraduationCap } from 'lucide-react';
import { BarChartCard } from '../charts/BarChartCard';
import { ChartLegend } from '../charts/ChartLegend';
import { WidgetLink } from './WidgetLink';
import { chartColor } from '../charts/chartTheme';
import type { LearningSummary } from '@/types';

const short = (s: string) => (s.length > 14 ? `${s.slice(0, 13)}…` : s);

/** Learning widget — completion by phase + headline learning stats. */
export function LearningOverviewWidget({ data, loading }: { data?: LearningSummary; loading?: boolean }) {
  const chartData = (data?.phaseProgress ?? []).map((p) => ({ name: short(p.title || p.phaseId), completion: p.completionPercent }));
  return (
    <BarChartCard
      title="Learning"
      icon={<GraduationCap className="size-4" />}
      action={<WidgetLink to="/analytics/learning" />}
      data={chartData}
      xKey="name"
      dataKey="completion"
      name="Completion"
      color={chartColor.primary}
      horizontal
      height={220}
      valueSuffix="%"
      loading={loading}
      footer={
        <ChartLegend
          items={[
            { label: 'Completion', color: chartColor.success, value: `${data?.completionPercent ?? 0}%` },
            { label: 'Velocity', color: chartColor.primary, value: `${data?.learningVelocityPerWeek ?? 0}/wk` },
            { label: 'Mastery', color: chartColor.warning, value: `${data?.averageMastery ?? 0}%` },
          ]}
        />
      }
    />
  );
}
