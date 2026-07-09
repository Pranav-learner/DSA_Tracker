import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contestWorkspaceApi } from '@/api/contest.api';
import { queryKeys } from '@/lib/queryClient';
import type { CreateContestProblemInput, CreateTimelineEventInput, UpdateContestProblemInput } from '@/types';

/** The complete contest workspace (contest + problems + performance + timeline). */
export function useContestWorkspace(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contestWorkspace(id ?? ''),
    queryFn: ({ signal }) => contestWorkspaceApi.workspace(id as string, signal),
    enabled: Boolean(id),
  });
}

export function useContestTimeline(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contestTimeline(id ?? ''),
    queryFn: ({ signal }) => contestWorkspaceApi.timeline(id as string, signal),
    enabled: Boolean(id),
  });
}

export function useContestPerformance(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contestPerformance(id ?? ''),
    queryFn: ({ signal }) => contestWorkspaceApi.performance(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Invalidate every workspace surface for a contest + the dashboard. */
function useInvalidateWorkspace(contestId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.contestWorkspace(contestId) });
    qc.invalidateQueries({ queryKey: queryKeys.contestProblems(contestId) });
    qc.invalidateQueries({ queryKey: queryKeys.contestPerformance(contestId) });
    qc.invalidateQueries({ queryKey: queryKeys.contestTimeline(contestId) });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useAddContestProblem(contestId: string) {
  const invalidate = useInvalidateWorkspace(contestId);
  return useMutation({
    mutationFn: (input: CreateContestProblemInput) => contestWorkspaceApi.addProblem(contestId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateContestProblem(contestId: string) {
  const invalidate = useInvalidateWorkspace(contestId);
  return useMutation({
    mutationFn: ({ problemId, patch }: { problemId: string; patch: UpdateContestProblemInput }) =>
      contestWorkspaceApi.updateProblem(problemId, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteContestProblem(contestId: string) {
  const invalidate = useInvalidateWorkspace(contestId);
  return useMutation({ mutationFn: (problemId: string) => contestWorkspaceApi.removeProblem(problemId), onSuccess: invalidate });
}

export function useAddTimelineEvent(contestId: string) {
  const invalidate = useInvalidateWorkspace(contestId);
  return useMutation({
    mutationFn: (input: CreateTimelineEventInput) => contestWorkspaceApi.addTimelineEvent(contestId, input),
    onSuccess: invalidate,
  });
}
