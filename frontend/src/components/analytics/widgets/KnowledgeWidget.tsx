import { NotebookPen } from 'lucide-react';
import { GaugeWidget } from './GaugeWidget';
import { chartColor } from '../charts/chartTheme';
import type { KnowledgeSummaryAnalytics } from '@/types';

/** Knowledge widget — coverage gauge + key documentation stats. */
export function KnowledgeWidget({ data, loading }: { data?: KnowledgeSummaryAnalytics; loading?: boolean }) {
  return (
    <GaugeWidget
      title="Knowledge"
      icon={<NotebookPen className="size-4" />}
      to="/analytics/knowledge"
      value={data?.coveragePercent ?? 0}
      gaugeLabel="Coverage"
      color={chartColor.primary}
      loading={loading}
      stats={[
        { label: 'Entries', value: data?.notebookEntries ?? 0 },
        { label: 'Patterns', value: data?.patternsLearned ?? 0 },
        { label: 'Avg confidence', value: `${data?.averageConfidence ?? 0}%` },
      ]}
    />
  );
}
