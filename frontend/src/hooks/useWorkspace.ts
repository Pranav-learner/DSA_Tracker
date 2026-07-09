import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { problemApi } from '@/api/problem.api';
import { queryKeys } from '@/lib/queryClient';
import { invalidateProblemLearning } from '@/lib/invalidate';
import type { CompleteProblemInput } from '@/types';

/** The aggregated problem workspace (one request). */
export function useProblemWorkspace(problemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspace(problemId ?? ''),
    queryFn: ({ signal }) => problemApi.workspace(problemId as string, signal),
    enabled: Boolean(problemId),
  });
}

/** Read-only learning-impact snapshot for a problem. */
export function useLearningImpact(problemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.learningImpact(problemId ?? ''),
    queryFn: ({ signal }) => problemApi.learningImpact(problemId as string, signal),
    enabled: Boolean(problemId),
  });
}

/**
 * Complete a problem → triggers the backend integration flow, then invalidates
 * every affected query so the workspace, dashboard, recommendation and library
 * all refresh automatically.
 */
export function useCompleteProblem(problemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input?: CompleteProblemInput) => problemApi.complete(problemId, input ?? {}),
    onSuccess: () => invalidateProblemLearning(qc, problemId),
  });
}
