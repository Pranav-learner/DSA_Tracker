import { MetricCard, AnalyticsGrid } from '@/components/analytics';
import type { ReportMetric } from '@/types';

/** A grid of the report's key metrics. */
export function MetricSection({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <AnalyticsGrid cols={4}>
      {metrics.map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} hint={m.hint} />
      ))}
    </AnalyticsGrid>
  );
}
