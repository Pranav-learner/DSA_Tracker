import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import type { ProblemsQuery, NotebookQuery, RevisionQuery, SessionHistoryQuery } from '@/types';

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
  // --- Module 2 · Sprint 4: workspace + integration ---
  workspace: (problemId: string) => ['problems', problemId, 'workspace'] as const,
  learningImpact: (problemId: string) => ['problems', problemId, 'learning-impact'] as const,
  // --- Module 2 · Sprint 3: pattern notebook ---
  notebook: ['notebook'] as const,
  notebookList: (query: NotebookQuery) => ['notebook', 'list', query] as const,
  notebookEntry: (id: string) => ['notebook', 'detail', id] as const,
  notebookFacets: ['notebook', 'facets'] as const,
  notebookByProblem: (problemId: string) => ['notebook', 'by-problem', problemId] as const,
  // --- Module 3 · Sprint 1: revision engine ---
  revision: ['revision'] as const,
  revisionToday: ['revision', 'today'] as const,
  revisionCalendar: (range: { from?: string; to?: string }) => ['revision', 'calendar', range] as const,
  revisionSchedules: (query: RevisionQuery) => ['revision', 'schedules', query] as const,
  revisionSchedule: (id: string) => ['revision', 'schedule', id] as const,
  // --- Module 3 · Sprint 2: revision sessions ---
  revisionWorkspace: (params: object) => ['revision', 'workspace', params] as const,
  revisionActiveSession: ['revision', 'session', 'active'] as const,
  revisionSession: (id: string) => ['revision', 'session', id] as const,
  revisionHistory: (query: SessionHistoryQuery) => ['revision', 'history', query] as const,
  revisionEntityHistory: (entityId: string) => ['revision', 'history', 'entity', entityId] as const,
  // --- Module 3 · Sprint 3: retention engine ---
  retention: ['retention'] as const,
  retentionList: (params: { entityType?: string }) => ['retention', 'list', params] as const,
  retentionOverview: ['retention', 'overview'] as const,
  retentionHistory: (params: { limit?: number }) => ['retention', 'history', params] as const,
  retentionEntity: (entityId: string) => ['retention', 'entity', entityId] as const,
  confidence: ['confidence'] as const,
  // --- Module 4 · Sprint 1: analytics ---
  analytics: ['analytics'] as const,
  analyticsScope: (scope: string, params: object) => ['analytics', scope, params] as const,
  // --- Module 4 · Sprint 4: reports & executive ---
  executive: (params: object) => ['analytics', 'executive', params] as const,
  report: (kind: string, params: object = {}) => ['reports', kind, params] as const,
  // --- Module 5 · Sprint 1: contests ---
  contests: ['contests'] as const,
  contestList: (query: object) => ['contests', 'list', query] as const,
  contest: (id: string) => ['contests', 'detail', id] as const,
  contestStats: ['contests', 'stats'] as const,
  contestFacets: ['contests', 'facets'] as const,
  ratings: (platform: string) => ['ratings', platform] as const,
  ratingHistory: (platform: string) => ['ratings', 'history', platform] as const,
  // --- Module 5 · Sprint 2: contest workspace ---
  contestWorkspace: (id: string) => ['contests', 'workspace', id] as const,
  contestProblems: (id: string) => ['contests', 'problems', id] as const,
  contestTimeline: (id: string) => ['contests', 'timeline', id] as const,
  contestPerformance: (id: string) => ['contests', 'performance', id] as const,
  // --- Module 5 · Sprint 3: contest learning ---
  contestLearning: (id: string) => ['contests', 'learning', id] as const,
  contestPostmortem: (id: string) => ['contests', 'postmortem', id] as const,
  upsolve: ['upsolve'] as const,
  upsolveList: (query: object) => ['upsolve', 'list', query] as const,
  upsolveQueue: ['upsolve', 'queue'] as const,
  upsolveTask: (id: string) => ['upsolve', 'task', id] as const,
  // --- Module 5 · Sprint 4: competitive intelligence ---
  competitiveIntelligence: ['competitive', 'intelligence'] as const,
  competitiveReadiness: ['competitive', 'readiness'] as const,
  competitiveCorrelation: ['competitive', 'correlation'] as const,
  competitiveInsights: ['competitive', 'insights'] as const,
  competitiveRating: ['competitive', 'rating-analysis'] as const,
  // --- Module 6 · Sprint 1: gamification / progression ---
  gamification: ['gamification'] as const,
  progression: ['gamification', 'progression'] as const,
  rewards: (limit: number) => ['gamification', 'rewards', limit] as const,
  rewardHistory: (query: object) => ['gamification', 'rewards', 'history', query] as const,
  levels: ['gamification', 'levels'] as const,
  streaks: ['gamification', 'streaks'] as const,
};
