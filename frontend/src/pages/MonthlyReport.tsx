import { useMonthlyReport } from '@/hooks/useReports';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingAnalytics } from '@/components/analytics';
import { ReportView } from '@/components/reports';

/** Monthly Report — the last 30 days, printable and exportable. */
export function MonthlyReport() {
  const { data, isLoading, isError, error, refetch } = useMonthlyReport();
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !data) return <LoadingAnalytics metrics={8} panels={3} />;
  return <ReportView report={data} type="monthly" />;
}
