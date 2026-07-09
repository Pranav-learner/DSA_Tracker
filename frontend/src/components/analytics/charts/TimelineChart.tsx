import type { ReactNode } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import { chartColor, axisProps, gridProps, ANIM } from './chartTheme';
import type { TimePoint } from '@/types';

interface TimelineChartProps {
  title?: string;
  icon?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  data: TimePoint[];
  name: string;
  color?: string;
  height?: number;
  loading?: boolean;
  footer?: ReactNode;
}

/** Reusable time bar-series ({date,count}) — events/reviews per period. */
export function TimelineChart({
  title,
  icon,
  subtitle,
  action,
  data,
  name,
  color = chartColor.primary,
  height = 220,
  loading,
  footer,
}: TimelineChartProps) {
  const empty = !loading && data.length === 0;
  return (
    <ChartContainer title={title} icon={icon} subtitle={subtitle} action={action} height={height} loading={loading} empty={empty} footer={footer}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="date" {...axisProps} minTickGap={20} />
          <YAxis {...axisProps} width={32} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
          <Bar dataKey="count" name={name} fill={color} radius={[3, 3, 0, 0]} {...ANIM} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
