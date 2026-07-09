import { CalendarClock } from 'lucide-react';
import { GaugeWidget } from './GaugeWidget';
import { chartColor } from '../charts/chartTheme';
import type { RevisionSummaryAnalytics } from '@/types';

/** Revision widget — consistency gauge + review stats. */
export function RevisionWidget({ data, loading }: { data?: RevisionSummaryAnalytics; loading?: boolean }) {
  return (
    <GaugeWidget
      title="Revision"
      icon={<CalendarClock className="size-4" />}
      to="/analytics/revision"
      value={data?.revisionConsistencyPercent ?? 0}
      gaugeLabel="Consistency"
      color={chartColor.success}
      loading={loading}
      stats={[
        { label: 'Completed', value: data?.reviewsCompleted ?? 0 },
        { label: 'Overdue', value: data?.overdueReviews ?? 0 },
        { label: 'Frequency', value: `${data?.reviewFrequencyPerWeek ?? 0}/wk` },
      ]}
    />
  );
}
