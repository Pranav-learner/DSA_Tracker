import type { ReactNode } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import { chartColor, axisProps, gridProps, paletteAt, ANIM } from './chartTheme';

interface BarChartCardProps {
  title?: string;
  icon?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  data: object[];
  xKey: string;
  dataKey: string;
  name: string;
  height?: number;
  loading?: boolean;
  /** Colour each bar from the categorical palette instead of one colour. */
  colorful?: boolean;
  color?: string;
  horizontal?: boolean;
  valueSuffix?: string;
  footer?: ReactNode;
}

/** Reusable bar chart (distributions, counts). Supports vertical/horizontal + per-bar colours. */
export function BarChartCard({
  title,
  icon,
  subtitle,
  action,
  data,
  xKey,
  dataKey,
  name,
  height = 240,
  loading,
  colorful = false,
  color = chartColor.primary,
  horizontal = false,
  valueSuffix = '',
  footer,
}: BarChartCardProps) {
  const empty = !loading && data.length === 0;
  return (
    <ChartContainer title={title} icon={icon} subtitle={subtitle} action={action} height={height} loading={loading} empty={empty} footer={footer}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 8, bottom: 0, left: horizontal ? 8 : -16 }}
        >
          <CartesianGrid {...gridProps} horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey={xKey} {...axisProps} width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} width={40} />
            </>
          )}
          <Tooltip content={<ChartTooltip formatter={(v) => `${v}${valueSuffix}`} />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
          <Bar dataKey={dataKey} name={name} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} {...ANIM}>
            {data.map((_, i) => (
              <Cell key={i} fill={colorful ? paletteAt(i) : color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
