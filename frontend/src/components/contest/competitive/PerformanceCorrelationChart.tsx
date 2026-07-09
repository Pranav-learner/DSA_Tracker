import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, chartColor, axisProps, gridProps } from '@/components/analytics/charts';
import type { ContestCorrelation } from '@/types';

const short = (s: string) => s.replace(/ → /g, '→');

/** Grouped bars comparing the two sides of each learning↔contest correlation. */
export function PerformanceCorrelationChart({ correlation, height = 300 }: { correlation: ContestCorrelation; height?: number }) {
  const data = correlation.items.map((c) => ({ name: short(c.label), [c.xLabel]: c.xValue, [c.yLabel]: c.yValue, x: c.xValue, y: c.yValue }));
  const empty = data.length === 0;
  return (
    <ChartContainer title="Learning ↔ Contest Correlation" height={height} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
          <CartesianGrid {...gridProps} horizontal={false} vertical />
          <XAxis type="number" domain={[0, 100]} {...axisProps} />
          <YAxis type="category" dataKey="name" {...axisProps} width={130} />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
          <Legend />
          <Bar dataKey="x" name="Learning metric" fill={chartColor.primary} radius={[0, 4, 4, 0]} />
          <Bar dataKey="y" name="Contest metric" fill={chartColor.success} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
