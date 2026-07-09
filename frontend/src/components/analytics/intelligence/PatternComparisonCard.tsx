import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend } from 'recharts';
import { CardContainer } from '@/components/common/CardContainer';
import { ChartTooltip, chartColor, softColor } from '@/components/analytics/charts';
import { MATRIX_DIMENSIONS } from '@/lib/intelligence';
import type { PatternProfile } from '@/types';

/**
 * PatternComparisonCard — overlays two patterns' confidence matrices on one
 * radar so strengths/gaps line up at a glance.
 */
export function PatternComparisonCard({ a, b }: { a: PatternProfile; b: PatternProfile }) {
  const data = MATRIX_DIMENSIONS.filter((d) => d.key !== 'overallMastery').map((d) => ({
    axis: d.label,
    [a.title]: a.matrix[d.key],
    [b.title]: b.matrix[d.key],
  }));

  return (
    <CardContainer className="space-y-3">
      <h3 className="text-sm font-semibold">
        {a.title} vs {b.title}
      </h3>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke={chartColor.grid} />
            <PolarAngleAxis dataKey="axis" tick={{ fill: chartColor.axis, fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Radar name={a.title} dataKey={a.title} stroke={chartColor.primary} fill={softColor('primary', 0.2)} fillOpacity={1} />
            <Radar name={b.title} dataKey={b.title} stroke={chartColor.warning} fill={softColor('warning', 0.2)} fillOpacity={1} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </CardContainer>
  );
}
