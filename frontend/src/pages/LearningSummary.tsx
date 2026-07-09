import { useSummaryReport } from '@/hooks/useReports';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingAnalytics } from '@/components/analytics';
import { ReportView } from '@/components/reports';

/** Learning Summary — a current-snapshot retrospective, printable/exportable. */
export function LearningSummary() {
  const { data, isLoading, isError, error, refetch } = useSummaryReport();
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !data) return <LoadingAnalytics metrics={8} panels={3} />;
  return <ReportView report={data} type="summary" />;
}
