import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { contestLearningApi, upsolveApi } from '@/api/contest.api';
import { queryKeys } from '@/lib/queryClient';
import type { UpdateUpsolveInput, UpsertPostmortemInput, UpsolveQueryInput } from '@/types';

/** The full contest learning workspace (postmortem + upsolve + analysis). */
export function useContestLearning(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contestLearning(id ?? ''),
    queryFn: ({ signal }) => contestLearningApi.learning(id as string, signal),
    enabled: Boolean(id),
  });
}

export function usePostmortem(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contestPostmortem(id ?? ''),
    queryFn: ({ signal }) => contestLearningApi.getPostmortem(id as string, signal),
    enabled: Boolean(id),
  });
}

/** The global upsolve queue. */
export function useUpsolveQueue() {
  return useQuery({ queryKey: queryKeys.upsolveQueue, queryFn: ({ signal }) => upsolveApi.queue(signal) });
}

export function useUpsolveList(query: UpsolveQueryInput = {}) {
  return useQuery({
    queryKey: queryKeys.upsolveList(query),
    queryFn: ({ signal }) => upsolveApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateLearning(contestId?: string) {
  const qc = useQueryClient();
  return () => {
    if (contestId) {
      qc.invalidateQueries({ queryKey: queryKeys.contestLearning(contestId) });
      qc.invalidateQueries({ queryKey: queryKeys.contestPostmortem(contestId) });
    }
    qc.invalidateQueries({ queryKey: queryKeys.upsolve });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    // Completing an upsolve earns XP — refresh all progression surfaces.
    qc.invalidateQueries({ queryKey: queryKeys.gamification });
  };
}

export function useSavePostmortem(contestId: string) {
  const invalidate = useInvalidateLearning(contestId);
  return useMutation({
    mutationFn: (input: UpsertPostmortemInput) => contestLearningApi.savePostmortem(contestId, input),
    onSuccess: invalidate,
  });
}

export function useGenerateUpsolve(contestId: string) {
  const invalidate = useInvalidateLearning(contestId);
  return useMutation({ mutationFn: () => contestLearningApi.generateUpsolve(contestId), onSuccess: invalidate });
}

/** Update / complete an upsolve task (completion syncs the Learning Engine server-side). */
export function useUpdateUpsolve(contestId?: string) {
  const invalidate = useInvalidateLearning(contestId);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateUpsolveInput }) => upsolveApi.update(id, patch),
    onSuccess: invalidate,
  });
}
