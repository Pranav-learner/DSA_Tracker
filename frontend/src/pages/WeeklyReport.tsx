import { useWeeklyReport } from '@/hooks/useReports';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingAnalytics } from '@/components/analytics';
import { ReportView } from '@/components/reports';

/** Weekly Report — the last 7 days, printable and exportable. */
export function WeeklyReport() {
  const { data, isLoading, isError, error, refetch } = useWeeklyReport();
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading || !data) return <LoadingAnalytics metrics={8} panels={3} />;
  return <ReportView report={data} type="weekly" />;
}
