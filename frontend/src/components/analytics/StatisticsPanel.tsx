import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { ANALYTICS_TONE_TEXT, type AnalyticsTone } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export interface StatRow {
  label: string;
  value: ReactNode;
  tone?: AnalyticsTone;
}

interface StatisticsPanelProps {
  title?: string;
  rows: StatRow[];
  className?: string;
}

/** A compact label:value list of statistics — the text counterpart to a chart. */
export function StatisticsPanel({ title, rows, className }: StatisticsPanelProps) {
  return (
    <CardContainer className={cn('space-y-3', className)}>
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <dl className="divide-y divide-border/60">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className={cn('text-sm font-semibold tabular-nums', ANALYTICS_TONE_TEXT[row.tone ?? 'default'])}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </CardContainer>
  );
}
