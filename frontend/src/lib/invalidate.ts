import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryClient';

/**
 * Invalidate every query a problem-level learning change can affect — the single
 * synchronization point shared by completion, attempt and notebook mutations. It
 * targets ONLY affected queries (never a blanket refetch), so the dashboard,
 * recommendation and workspace refresh automatically without a page reload.
 */
export function invalidateProblemLearning(qc: QueryClient, problemId: string): void {
  const keys = [
    // The problem's own surfaces
    queryKeys.workspace(problemId),
    queryKeys.problem(problemId),
    queryKeys.learningImpact(problemId),
    queryKeys.attempts(problemId),
    queryKeys.attemptSummary(problemId),
    queryKeys.notebookByProblem(problemId),
    // Library list (status overlay) + notebook index
    queryKeys.problems,
    queryKeys.notebook,
    // Module 1 learning engine + dashboard
    queryKeys.dashboard,
    queryKeys.progress,
    queryKeys.learningState,
    queryKeys.recommendation,
  ];
  for (const queryKey of keys) qc.invalidateQueries({ queryKey });
}
