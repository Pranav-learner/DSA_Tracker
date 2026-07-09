import type { ReactNode } from 'react';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import { chartColor, softColor, ANIM } from './chartTheme';

export interface RadarPoint {
  axis: string;
  value: number;
}

interface RadarChartCardProps {
  title?: string;
  icon?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  data: RadarPoint[];
  name: string;
  height?: number;
  loading?: boolean;
  color?: string;
  max?: number;
}

/** Reusable radar chart (multi-axis health/mastery profiles). */
export function RadarChartCard({
  title,
  icon,
  subtitle,
  action,
  data,
  name,
  height = 240,
  loading,
  color = chartColor.primary,
  max = 100,
}: RadarChartCardProps) {
  const empty = !loading && data.length === 0;
  return (
    <ChartContainer title={title} icon={icon} subtitle={subtitle} action={action} height={height} loading={loading} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={chartColor.grid} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: chartColor.axis, fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v}`} />} />
          <Radar name={name} dataKey="value" stroke={color} fill={softColor('primary', 0.25)} fillOpacity={1} {...ANIM} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
