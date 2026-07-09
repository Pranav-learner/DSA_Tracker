import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attemptApi } from '@/api/attempt.api';
import { queryKeys } from '@/lib/queryClient';
import { invalidateProblemLearning } from '@/lib/invalidate';
import type { CreateAttemptInput, UpdateAttemptInput } from '@/types';

/** Full attempt history for a problem (newest first). */
export function useProblemAttempts(problemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attempts(problemId ?? ''),
    queryFn: ({ signal }) => attemptApi.listByProblem(problemId as string, signal),
    enabled: Boolean(problemId),
  });
}

/** Aggregated attempt summary for a problem. */
export function useProblemAttemptSummary(problemId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attemptSummary(problemId ?? ''),
    queryFn: ({ signal }) => attemptApi.summary(problemId as string, signal),
    enabled: Boolean(problemId),
  });
}

/**
 * A write to a problem's attempts can now trigger the learning integration (a
 * solve updates mastery/dashboard/recommendation), so it invalidates the full
 * learning surface via the shared invalidator.
 */
function useInvalidateAttempts(problemId: string) {
  const qc = useQueryClient();
  return () => invalidateProblemLearning(qc, problemId);
}

export function useCreateAttempt(problemId: string) {
  const invalidate = useInvalidateAttempts(problemId);
  return useMutation({
    mutationFn: (input: CreateAttemptInput) => attemptApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateAttempt(problemId: string) {
  const invalidate = useInvalidateAttempts(problemId);
  return useMutation({
    mutationFn: ({ attemptId, patch }: { attemptId: string; patch: UpdateAttemptInput }) =>
      attemptApi.update(attemptId, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteAttempt(problemId: string) {
  const invalidate = useInvalidateAttempts(problemId);
  return useMutation({
    mutationFn: (attemptId: string) => attemptApi.remove(attemptId),
    onSuccess: invalidate,
  });
}
