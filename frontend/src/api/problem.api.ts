import { apiGet, apiSend } from './client';
import type {
  CompleteProblemInput,
  LearningImpact,
  PaginatedProblems,
  ProblemDetail,
  ProblemFacets,
  ProblemsQuery,
  ProblemWorkspace,
} from '@/types';

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
  // --- Module 2 · Sprint 4: workspace + integration ---
  workspace: (id: string, signal?: AbortSignal) =>
    apiGet<ProblemWorkspace>(`/problems/${id}/workspace`, signal),
  complete: (id: string, body: CompleteProblemInput = {}) =>
    apiSend<LearningImpact>('POST', `/problems/${id}/complete`, body),
  learningImpact: (id: string, signal?: AbortSignal) =>
    apiGet<LearningImpact>(`/problems/${id}/learning-impact`, signal),
};
