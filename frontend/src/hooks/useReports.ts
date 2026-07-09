import { useQuery, useMutation } from '@tanstack/react-query';
import { analyticsApi, reportsApi, downloadReportExport } from '@/api/analytics.api';
import { queryKeys } from '@/lib/queryClient';
import { useAnalyticsParams } from './useAnalytics';
import type { ExportFormat, ReportKind } from '@/types';

/** Executive dashboard summary (scores + insights + recommendations). */
export function useExecutive() {
  const params = useAnalyticsParams();
  return useQuery({
    queryKey: queryKeys.executive(params),
    queryFn: ({ signal }) => analyticsApi.executive(params, signal),
  });
}

export const useWeeklyReport = () =>
  useQuery({ queryKey: queryKeys.report('weekly'), queryFn: ({ signal }) => reportsApi.weekly(signal) });
export const useMonthlyReport = () =>
  useQuery({ queryKey: queryKeys.report('monthly'), queryFn: ({ signal }) => reportsApi.monthly(signal) });
export const useSummaryReport = () =>
  useQuery({ queryKey: queryKeys.report('summary'), queryFn: ({ signal }) => reportsApi.summary(signal) });

export function usePhaseReport(phaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.report('phase', { phaseId: phaseId ?? '' }),
    queryFn: ({ signal }) => reportsApi.phase(phaseId as string, signal),
    enabled: Boolean(phaseId),
  });
}

/** Mutation that downloads a report export (the server renders it). */
export function useExportReport() {
  return useMutation({
    mutationFn: ({ format, type, phaseId }: { format: ExportFormat; type: ReportKind; phaseId?: string }) =>
      downloadReportExport(format, type, phaseId),
  });
}
