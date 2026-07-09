import type { ReactNode } from 'react';
import { ChartContainer } from '../charts/ChartContainer';
import { ProgressGauge } from '../charts/ProgressGauge';
import { chartColor } from '../charts/chartTheme';
import { WidgetLink } from './WidgetLink';

export interface GaugeStat {
  label: string;
  value: ReactNode;
}

/**
 * GaugeWidget — a radial gauge for a headline 0–100 metric plus a small stat
 * list. Shared shape behind the Knowledge / Revision / Retention widgets.
 */
export function GaugeWidget({
  title,
  icon,
  to,
  value,
  gaugeLabel,
  color = chartColor.primary,
  stats,
  loading,
}: {
  title: string;
  icon?: ReactNode;
  to: string;
  value: number;
  gaugeLabel: string;
  color?: string;
  stats: GaugeStat[];
  loading?: boolean;
}) {
  return (
    <ChartContainer title={title} icon={icon} action={<WidgetLink to={to} />} height={180} loading={loading}>
      <div className="flex h-full items-center gap-4">
        <ProgressGauge value={value} label={gaugeLabel} color={color} size={150} />
        <dl className="flex-1 space-y-2">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-2">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="text-sm font-semibold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </ChartContainer>
  );
}
