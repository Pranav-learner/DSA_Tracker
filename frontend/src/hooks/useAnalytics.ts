import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsParams } from '@/api/analytics.api';
import { queryKeys } from '@/lib/queryClient';
import { useAppSelector } from '@/store/hooks';

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
export const useLearningAnalytics = () => useAnalyticsQuery('learning', analyticsApi.learning);
export const useProblemAnalytics = () => useAnalyticsQuery('problems', analyticsApi.problems);
export const useKnowledgeAnalytics = () => useAnalyticsQuery('knowledge', analyticsApi.knowledge);
export const useRevisionAnalytics = () => useAnalyticsQuery('revision', analyticsApi.revision);
export const useRetentionAnalytics = () => useAnalyticsQuery('retention', analyticsApi.retention);
export const useActivityAnalytics = () => useAnalyticsQuery('activity', analyticsApi.activity);
