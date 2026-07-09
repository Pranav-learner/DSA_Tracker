import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { problemApi } from '@/api/problem.api';
import { queryKeys } from '@/lib/queryClient';
import type { ProblemsQuery } from '@/types';

/**
 * Paginated, filtered problem list. `keepPreviousData` keeps the current page
 * visible while the next one loads, so paging/filtering never flashes empty.
 */
export function useProblems(query: ProblemsQuery) {
  return useQuery({
    queryKey: queryKeys.problemsList(query),
    queryFn: ({ signal }) => problemApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single problem's full detail. */
export function useProblem(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.problem(id ?? ''),
    queryFn: ({ signal }) => problemApi.getById(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Filter facets (platforms / difficulties / patterns). Effectively static. */
export function useProblemFacets() {
  return useQuery({
    queryKey: queryKeys.problemFacets,
    queryFn: ({ signal }) => problemApi.facets(signal),
    staleTime: Infinity,
  });
}
