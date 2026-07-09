import type { ReactNode } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import { chartColor, axisProps, gridProps, ANIM } from './chartTheme';

interface AreaChartCardProps {
  title?: string;
  icon?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  data: object[];
  xKey: string;
  dataKey: string;
  name: string;
  color?: string;
  height?: number;
  loading?: boolean;
  valueSuffix?: string;
  footer?: ReactNode;
}

/** Reusable single-series area chart (volume/activity over time). */
export function AreaChartCard({
  title,
  icon,
  subtitle,
  action,
  data,
  xKey,
  dataKey,
  name,
  color = chartColor.primary,
  height = 240,
  loading,
  valueSuffix = '',
  footer,
}: AreaChartCardProps) {
  const empty = !loading && data.length === 0;
  const gradientId = `area-${dataKey}`;
  return (
    <ChartContainer title={title} icon={icon} subtitle={subtitle} action={action} height={height} loading={loading} empty={empty} footer={footer}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} width={40} />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v}${valueSuffix}`} />} cursor={{ stroke: chartColor.border }} />
          <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} {...ANIM} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
