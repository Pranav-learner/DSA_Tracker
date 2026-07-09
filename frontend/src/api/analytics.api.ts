import { apiGet } from './client';
import type {
  ActivitySummary,
  AnalyticsOverview,
  AnalyticsRange,
  AnalyticsRecommendation,
  KnowledgeSummaryAnalytics,
  LearningInsight,
  LearningSummary,
  PatternProfile,
  ProblemSummary,
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
};
