import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsParams } from '@/api/analytics.api';
import { queryKeys } from '@/lib/queryClient';
import { useAppSelector } from '@/store/hooks';
import { previousWindow } from '@/lib/comparison';

/** Build the analytics params from the shared Redux date-range UI state. */
export function useAnalyticsParams(): AnalyticsParams {
  const { range, from, to } = useAppSelector((s) => s.analytics);
  if (range === 'custom') return { from: from ?? undefined, to: to ?? undefined };
  return { range };
}

function useAnalyticsQuery<T>(scope: string, fn: (p: AnalyticsParams, signal?: AbortSignal) => Promise<T>) {
  const params = useAnalyticsParams();
  return useQuery({
    queryKey: queryKeys.analyticsScope(scope, params),
    queryFn: ({ signal }) => fn(params, signal),
    placeholderData: keepPreviousData,
  });
}

export const useAnalyticsOverview = () => useAnalyticsQuery('overview', analyticsApi.overview);

// --- Module 4 · Sprint 3: pattern intelligence & insights ---
export const usePatterns = () => useAnalyticsQuery('patterns', analyticsApi.patterns);
export const useWeaknesses = () => useAnalyticsQuery('weaknesses', analyticsApi.weaknesses);
export const useStrengths = () => useAnalyticsQuery('strengths', analyticsApi.strengths);
export const useInsights = () => useAnalyticsQuery('insights', analyticsApi.insights);
export const useTrends = () => useAnalyticsQuery('trends', analyticsApi.trends);
export const useRecommendations = () => useAnalyticsQuery('recommendations', analyticsApi.recommendations);

export function usePattern(patternId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analyticsScope('pattern', { patternId: patternId ?? '' }),
    queryFn: ({ signal }) => analyticsApi.pattern(patternId as string, signal),
    enabled: Boolean(patternId),
  });
}

/**
 * The immediately-preceding overview window for period-over-period comparison.
 * Reuses the existing overview endpoint with from/to params; disabled when the
 * range isn't comparable (all / custom).
 */
export function usePreviousOverview() {
  const range = useAppSelector((s) => s.analytics.range);
  const prev = previousWindow(range);
  return useQuery({
    queryKey: queryKeys.analyticsScope('overview-prev', prev ?? { none: true }),
    queryFn: ({ signal }) => analyticsApi.overview(prev!, signal),
    enabled: Boolean(prev),
    placeholderData: keepPreviousData,
  });
}
export const useLearningAnalytics = () => useAnalyticsQuery('learning', analyticsApi.learning);
export const useProblemAnalytics = () => useAnalyticsQuery('problems', analyticsApi.problems);
export const useKnowledgeAnalytics = () => useAnalyticsQuery('knowledge', analyticsApi.knowledge);
export const useRevisionAnalytics = () => useAnalyticsQuery('revision', analyticsApi.revision);
export const useRetentionAnalytics = () => useAnalyticsQuery('retention', analyticsApi.retention);
export const useActivityAnalytics = () => useAnalyticsQuery('activity', analyticsApi.activity);
