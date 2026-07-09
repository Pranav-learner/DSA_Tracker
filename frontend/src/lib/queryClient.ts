import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import type { ProblemsQuery, NotebookQuery } from '@/types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry client errors (4xx) — only transient failures.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

/** Central query-key registry — keeps cache keys consistent & typo-free. */
export const queryKeys = {
  roadmap: ['roadmap'] as const,
  phases: ['phases'] as const,
  phase: (id: string) => ['phases', id] as const,
  phaseTopics: (id: string) => ['phases', id, 'topics'] as const,
  topics: ['topics'] as const,
  topic: (id: string) => ['topics', id] as const,
  topicRelated: (id: string) => ['topics', id, 'related'] as const,
  topicProblems: (id: string) => ['topics', id, 'problems'] as const,
  // --- Sprint 4: dashboard aggregation ---
  dashboard: ['dashboard'] as const,
  // --- Sprint 3: learning engine ---
  learningState: ['learning', 'state'] as const,
  progress: ['progress'] as const,
  recommendation: ['recommendation'] as const,
  unlockedTopics: ['topics', 'unlocked'] as const,
  topicProgress: (id: string) => ['topics', id, 'progress'] as const,
  topicMastery: (id: string) => ['topics', id, 'mastery'] as const,
  // --- Module 2 · Sprint 1: problem library ---
  problems: ['problems'] as const,
  problemsList: (query: ProblemsQuery) => ['problems', 'list', query] as const,
  problem: (id: string) => ['problems', 'detail', id] as const,
  problemFacets: ['problems', 'facets'] as const,
  // --- Module 2 · Sprint 2: attempt tracking ---
  attempts: (problemId: string) => ['problems', problemId, 'attempts'] as const,
  attemptSummary: (problemId: string) => ['problems', problemId, 'summary'] as const,
  // --- Module 2 · Sprint 3: pattern notebook ---
  notebook: ['notebook'] as const,
  notebookList: (query: NotebookQuery) => ['notebook', 'list', query] as const,
  notebookEntry: (id: string) => ['notebook', 'detail', id] as const,
  notebookFacets: ['notebook', 'facets'] as const,
  notebookByProblem: (problemId: string) => ['notebook', 'by-problem', problemId] as const,
};
