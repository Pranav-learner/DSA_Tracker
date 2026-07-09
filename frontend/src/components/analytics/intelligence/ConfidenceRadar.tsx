import type { ReactNode } from 'react';
import { RadarChartCard, chartColor } from '@/components/analytics/charts';
import { MATRIX_DIMENSIONS } from '@/lib/intelligence';
import type { PatternMatrix } from '@/types';

/** Radar of a pattern's confidence matrix (reuses the Sprint-2 radar chart). */
export function ConfidenceRadar({
  matrix,
  title = 'Confidence Matrix',
  icon,
  height = 280,
  loading,
}: {
  matrix?: PatternMatrix;
  title?: string;
  icon?: ReactNode;
  height?: number;
  loading?: boolean;
}) {
  const data = MATRIX_DIMENSIONS.filter((d) => d.key !== 'overallMastery').map((d) => ({
    axis: d.label,
    value: matrix ? matrix[d.key] : 0,
  }));
  return <RadarChartCard title={title} icon={icon} data={data} name="Score" color={chartColor.primary} height={height} loading={loading} />;
}
