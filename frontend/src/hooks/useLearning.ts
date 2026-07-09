import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningApi, progressApi, recommendationApi } from '@/api/learning.api';
import { topicApi } from '@/api/topic.api';
import { queryKeys } from '@/lib/queryClient';
import type { MasteryMetrics } from '@/types';

/** Composed learning state for the dashboard. */
export function useLearningState() {
  return useQuery({
    queryKey: queryKeys.learningState,
    queryFn: ({ signal }) => learningApi.state(signal),
  });
}

/** Overall roadmap progress + per-phase / per-topic overlays. */
export function useProgress() {
  return useQuery({
    queryKey: queryKeys.progress,
    queryFn: ({ signal }) => progressApi.get(signal),
  });
}

/** Rule-based next best action. */
export function useRecommendation() {
  return useQuery({
    queryKey: queryKeys.recommendation,
    queryFn: ({ signal }) => recommendationApi.get(signal),
  });
}

/** Topics currently unlocked for the user. */
export function useUnlockedTopics() {
  return useQuery({
    queryKey: queryKeys.unlockedTopics,
    queryFn: ({ signal }) => topicApi.unlocked(signal),
  });
}

/** Per-topic progress record. */
export function useTopicProgress(topicId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topicProgress(topicId ?? ''),
    queryFn: ({ signal }) => topicApi.progress(topicId as string, signal),
    enabled: Boolean(topicId),
  });
}

/** Per-topic mastery breakdown (metrics + weights + ladder). */
export function useTopicMastery(topicId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topicMastery(topicId ?? ''),
    queryFn: ({ signal }) => topicApi.mastery(topicId as string, signal),
    enabled: Boolean(topicId),
  });
}

/** Invalidate every query that a learning-data mutation can affect. */
function useInvalidateLearning() {
  const qc = useQueryClient();
  return (topicId?: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.learningState });
    qc.invalidateQueries({ queryKey: queryKeys.progress });
    qc.invalidateQueries({ queryKey: queryKeys.recommendation });
    qc.invalidateQueries({ queryKey: queryKeys.unlockedTopics });
    if (topicId) {
      qc.invalidateQueries({ queryKey: queryKeys.topicProgress(topicId) });
      qc.invalidateQueries({ queryKey: queryKeys.topicMastery(topicId) });
    }
  };
}

/** Update a topic's mastery metrics (drives status/unlock recomputation). */
export function useUpdateTopicProgress(topicId: string) {
  const invalidate = useInvalidateLearning();
  return useMutation({
    mutationFn: (patch: Partial<MasteryMetrics>) => topicApi.patchProgress(topicId, patch),
    onSuccess: () => invalidate(topicId),
  });
}

/** Explicitly unlock a topic (rule-checked server-side). */
export function useUnlockTopic() {
  const invalidate = useInvalidateLearning();
  return useMutation({
    mutationFn: (topicId: string) => topicApi.unlock(topicId),
    onSuccess: (_data, topicId) => invalidate(topicId),
  });
}
