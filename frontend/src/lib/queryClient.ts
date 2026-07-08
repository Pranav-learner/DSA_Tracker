import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';

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
};
