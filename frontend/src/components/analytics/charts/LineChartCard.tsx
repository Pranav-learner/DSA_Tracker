import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import { chartColor, axisProps, gridProps, ANIM } from './chartTheme';
import type { ReactNode } from 'react';

export interface LineSeries {
  key: string;
  name: string;
  color?: string;
}

interface LineChartCardProps {
  title?: string;
  icon?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  data: object[];
  xKey: string;
  series: LineSeries[];
  height?: number;
  loading?: boolean;
  valueSuffix?: string;
  footer?: ReactNode;
}

/** Reusable multi-series line chart (trends over time). */
export function LineChartCard({
  title,
  icon,
  subtitle,
  action,
  data,
  xKey,
  series,
  height = 240,
  loading,
  valueSuffix = '',
  footer,
}: LineChartCardProps) {
  const empty = !loading && data.length === 0;
  return (
    <ChartContainer title={title} icon={icon} subtitle={subtitle} action={action} height={height} loading={loading} empty={empty} footer={footer}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} width={40} />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v}${valueSuffix}`} />} cursor={{ stroke: chartColor.border }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? chartColor.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              {...ANIM}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
