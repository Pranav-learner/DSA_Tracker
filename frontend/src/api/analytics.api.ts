import { apiGet } from './client';
import type {
  ActivitySummary,
  AnalyticsOverview,
  AnalyticsRange,
  AnalyticsRecommendation,
  Executive,
  ExportFormat,
  KnowledgeSummaryAnalytics,
  LearningInsight,
  LearningSummary,
  PatternProfile,
  PhaseReport,
  ProblemSummary,
  Report,
  ReportKind,
  RetentionSummaryAnalytics,
  RevisionSummaryAnalytics,
  Strength,
  Trend,
  Weakness,
} from '@/types';

export interface AnalyticsParams {
  range?: AnalyticsRange;
  from?: string;
  to?: string;
}

function toQueryString(params: AnalyticsParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Analytics API — the frontend only ever talks to the aggregation layer
 * (`/api/analytics/*`), never to individual module endpoints for analytics.
 * The analytics envelope is a superset of `{ success, data }`, so the shared
 * client unwraps `data` transparently.
 */
export const analyticsApi = {
  overview: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<AnalyticsOverview>(`/analytics/overview${toQueryString(params)}`, signal),
  learning: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<LearningSummary>(`/analytics/learning${toQueryString(params)}`, signal),
  problems: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<ProblemSummary>(`/analytics/problems${toQueryString(params)}`, signal),
  knowledge: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<KnowledgeSummaryAnalytics>(`/analytics/knowledge${toQueryString(params)}`, signal),
  revision: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<RevisionSummaryAnalytics>(`/analytics/revision${toQueryString(params)}`, signal),
  retention: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<RetentionSummaryAnalytics>(`/analytics/retention${toQueryString(params)}`, signal),
  activity: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<ActivitySummary>(`/analytics/activity${toQueryString(params)}`, signal),

  // Module 4 · Sprint 3 — pattern intelligence & insights.
  patterns: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<PatternProfile[]>(`/analytics/patterns${toQueryString(params)}`, signal),
  pattern: (patternId: string, signal?: AbortSignal) =>
    apiGet<PatternProfile>(`/analytics/patterns/${patternId}`, signal),
  weaknesses: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<Weakness[]>(`/analytics/weaknesses${toQueryString(params)}`, signal),
  strengths: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<Strength[]>(`/analytics/strengths${toQueryString(params)}`, signal),
  insights: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<LearningInsight[]>(`/analytics/insights${toQueryString(params)}`, signal),
  trends: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<Trend[]>(`/analytics/trends${toQueryString(params)}`, signal),
  recommendations: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<AnalyticsRecommendation[]>(`/analytics/recommendations${toQueryString(params)}`, signal),
  executive: (params: AnalyticsParams = {}, signal?: AbortSignal) =>
    apiGet<Executive>(`/analytics/executive${toQueryString(params)}`, signal),
};

/** Report generation + export (Module 4 · Sprint 4). */
export const reportsApi = {
  weekly: (signal?: AbortSignal) => apiGet<Report>('/reports/weekly', signal),
  monthly: (signal?: AbortSignal) => apiGet<Report>('/reports/monthly', signal),
  summary: (signal?: AbortSignal) => apiGet<Report>('/reports/summary', signal),
  phase: (phaseId: string, signal?: AbortSignal) => apiGet<PhaseReport>(`/reports/phase/${phaseId}`, signal),
};

const EXPORT_PATH: Record<ExportFormat, string> = {
  pdf: 'pdf',
  markdown: 'markdown',
  json: 'json',
  csv: 'csv',
};

/**
 * Trigger a report export download. Fetches the file (respecting the analytics
 * base URL) and saves it via a temporary object URL — the server does all the
 * rendering; the client only downloads.
 */
export async function downloadReportExport(
  format: ExportFormat,
  type: ReportKind,
  phaseId?: string,
): Promise<void> {
  const { env } = await import('@/config/env');
  const params = new URLSearchParams({ type });
  if (phaseId) params.set('phaseId', phaseId);
  const res = await fetch(`${env.apiUrl}/reports/export/${EXPORT_PATH[format]}?${params.toString()}`);
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cp-os-${type}-report.${format === 'markdown' ? 'md' : format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
