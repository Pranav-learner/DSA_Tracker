import { Brain } from 'lucide-react';
import { GaugeWidget } from './GaugeWidget';
import { chartColor } from '../charts/chartTheme';
import type { RetentionSummaryAnalytics } from '@/types';

/** Retention widget — knowledge-health gauge + retention stats. */
export function RetentionWidget({ data, loading }: { data?: RetentionSummaryAnalytics; loading?: boolean }) {
  return (
    <GaugeWidget
      title="Retention"
      icon={<Brain className="size-4" />}
      to="/analytics/retention"
      value={data?.knowledgeHealthPercent ?? 0}
      gaugeLabel="Health"
      color={chartColor.warning}
      loading={loading}
      stats={[
        { label: 'Avg retention', value: `${data?.averageRetention ?? 0}%` },
        { label: 'Mastered', value: data?.masteredTopics ?? 0 },
        { label: 'At risk', value: data?.atRiskTopics ?? 0 },
      ]}
    />
  );
}
