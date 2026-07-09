import type { ReactNode } from 'react';
import { AreaChartCard } from '../charts/AreaChartCard';
import { chartColor } from '../charts/chartTheme';
import type { TimePoint } from '@/types';

/** Generic trend widget — an area chart over a {date,count} series. */
export function TrendWidget({
  title,
  icon,
  data,
  name = 'Value',
  color = chartColor.primary,
  action,
  height = 240,
  loading,
}: {
  title: string;
  icon?: ReactNode;
  data: TimePoint[];
  name?: string;
  color?: string;
  action?: ReactNode;
  height?: number;
  loading?: boolean;
}) {
  return (
    <AreaChartCard
      title={title}
      icon={icon}
      action={action}
      data={data}
      xKey="date"
      dataKey="count"
      name={name}
      color={color}
      height={height}
      loading={loading}
    />
  );
}
