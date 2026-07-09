import { apiGet } from './client';
import type { PaginatedProblems, ProblemDetail, ProblemFacets, ProblemsQuery } from '@/types';

/** Serialise a query object into a URL query string (skips empty values). */
export function toProblemQueryString(query: ProblemsQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const problemApi = {
  list: (query: ProblemsQuery, signal?: AbortSignal) =>
    apiGet<PaginatedProblems>(`/problems${toProblemQueryString(query)}`, signal),
  search: (query: ProblemsQuery, signal?: AbortSignal) =>
    apiGet<PaginatedProblems>(`/problems/search${toProblemQueryString(query)}`, signal),
  getById: (id: string, signal?: AbortSignal) => apiGet<ProblemDetail>(`/problems/${id}`, signal),
  facets: (signal?: AbortSignal) => apiGet<ProblemFacets>('/problems/facets', signal),
};
