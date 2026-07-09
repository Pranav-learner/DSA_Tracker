import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { contestApi, ratingApi } from '@/api/contest.api';
import { queryKeys } from '@/lib/queryClient';
import type { ContestPlatform, ContestQuery, CreateContestInput, UpdateContestInput } from '@/types';

/** Paginated, filterable contest library. */
export function useContests(query: ContestQuery) {
  return useQuery({
    queryKey: queryKeys.contestList(query),
    queryFn: ({ signal }) => contestApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useContest(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contest(id ?? ''),
    queryFn: ({ signal }) => contestApi.getById(id as string, signal),
    enabled: Boolean(id),
  });
}

export const useContestStats = () =>
  useQuery({ queryKey: queryKeys.contestStats, queryFn: ({ signal }) => contestApi.stats(signal) });

export const useContestFacets = () =>
  useQuery({ queryKey: queryKeys.contestFacets, queryFn: ({ signal }) => contestApi.facets(signal) });

export const useRatingSummary = (platform?: ContestPlatform) =>
  useQuery({ queryKey: queryKeys.ratings(platform ?? 'all'), queryFn: ({ signal }) => ratingApi.summary(platform, signal) });

export const useRatingHistory = (platform?: ContestPlatform) =>
  useQuery({ queryKey: queryKeys.ratingHistory(platform ?? 'all'), queryFn: ({ signal }) => ratingApi.history(platform, signal) });

/** Invalidate every contest/rating surface + the dashboard (embeds the widget). */
function useInvalidateContests() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.contests });
    qc.invalidateQueries({ queryKey: ['ratings'] });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useCreateContest() {
  const invalidate = useInvalidateContests();
  return useMutation({ mutationFn: (input: CreateContestInput) => contestApi.create(input), onSuccess: invalidate });
}

export function useUpdateContest() {
  const invalidate = useInvalidateContests();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateContestInput }) => contestApi.update(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteContest() {
  const invalidate = useInvalidateContests();
  return useMutation({ mutationFn: (id: string) => contestApi.remove(id), onSuccess: invalidate });
}
