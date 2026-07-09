import type { ReactNode } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { ChartTooltip } from './ChartTooltip';
import { ChartLegend } from './ChartLegend';
import { paletteAt, ANIM } from './chartTheme';

export interface PieSlice {
  name: string;
  value: number;
}

interface PieChartCardProps {
  title?: string;
  icon?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  data: PieSlice[];
  height?: number;
  loading?: boolean;
  /** Render as a donut (inner radius). */
  donut?: boolean;
  valueSuffix?: string;
}

/** Reusable pie / donut chart with a themed legend (categorical distributions). */
export function PieChartCard({
  title,
  icon,
  subtitle,
  action,
  data,
  height = 240,
  loading,
  donut = true,
  valueSuffix = '',
}: PieChartCardProps) {
  const empty = !loading && (data.length === 0 || data.every((d) => d.value === 0));
  const legend = data.map((d, i) => ({ label: d.name, color: paletteAt(i), value: `${d.value}${valueSuffix}` }));

  return (
    <ChartContainer
      title={title}
      icon={icon}
      subtitle={subtitle}
      action={action}
      height={height}
      loading={loading}
      empty={empty}
      footer={<ChartLegend items={legend} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip formatter={(v) => `${v}${valueSuffix}`} />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={donut ? '58%' : 0}
            outerRadius="82%"
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="hsl(var(--card))"
            strokeWidth={2}
            {...ANIM}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={paletteAt(i)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
