import { apiGet, apiSend } from './client';
import type {
  Contest,
  ContestFacets,
  ContestPerformance,
  ContestPlatform,
  ContestProblem,
  ContestQuery,
  ContestStats,
  ContestTimelineEvent,
  ContestWorkspace,
  CompetitiveIntelligence,
  CompetitiveInsight,
  ContestCorrelation,
  ContestLearning,
  ContestPostmortem,
  ContestReadiness,
  CreateContestInput,
  RatingAnalysis,
  CreateContestProblemInput,
  CreateTimelineEventInput,
  PaginatedContests,
  UpdateUpsolveInput,
  UpsertPostmortemInput,
  UpsolveQueryInput,
  UpsolveQueue,
  UpsolveTask,
  RatingHistoryPoint,
  RatingSummary,
  UpdateContestInput,
  UpdateContestProblemInput,
} from '@/types';

function toQueryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const contestApi = {
  list: (query: ContestQuery, signal?: AbortSignal) =>
    apiGet<PaginatedContests>(`/contests${toQueryString(query)}`, signal),
  stats: (signal?: AbortSignal) => apiGet<ContestStats>('/contests/stats', signal),
  facets: (signal?: AbortSignal) => apiGet<ContestFacets>('/contests/facets', signal),
  getById: (id: string, signal?: AbortSignal) => apiGet<Contest>(`/contests/${id}`, signal),
  create: (input: CreateContestInput) => apiSend<Contest>('POST', '/contests', input),
  update: (id: string, patch: UpdateContestInput) => apiSend<Contest>('PATCH', `/contests/${id}`, patch),
  remove: (id: string) => apiSend<{ id: string; deleted: boolean }>('DELETE', `/contests/${id}`),
};

/** Contest workspace: aggregate + problems + timeline + performance (Sprint 2). */
export const contestWorkspaceApi = {
  workspace: (id: string, signal?: AbortSignal) => apiGet<ContestWorkspace>(`/contests/${id}/workspace`, signal),
  problems: (id: string, signal?: AbortSignal) => apiGet<ContestProblem[]>(`/contests/${id}/problems`, signal),
  timeline: (id: string, signal?: AbortSignal) => apiGet<ContestTimelineEvent[]>(`/contests/${id}/timeline`, signal),
  performance: (id: string, signal?: AbortSignal) => apiGet<ContestPerformance>(`/contests/${id}/performance`, signal),
  addProblem: (id: string, input: CreateContestProblemInput) => apiSend<ContestProblem>('POST', `/contests/${id}/problems`, input),
  updateProblem: (problemId: string, patch: UpdateContestProblemInput) => apiSend<ContestProblem>('PATCH', `/contests/problems/${problemId}`, patch),
  removeProblem: (problemId: string) => apiSend<{ id: string; deleted: boolean }>('DELETE', `/contests/problems/${problemId}`),
  addTimelineEvent: (id: string, input: CreateTimelineEventInput) => apiSend<ContestTimelineEvent>('POST', `/contests/${id}/timeline`, input),
};

/** Contest learning: postmortem + upsolve (Sprint 3). */
export const contestLearningApi = {
  learning: (id: string, signal?: AbortSignal) => apiGet<ContestLearning>(`/contests/${id}/learning`, signal),
  getPostmortem: (id: string, signal?: AbortSignal) => apiGet<ContestPostmortem | null>(`/contests/${id}/postmortem`, signal),
  savePostmortem: (id: string, input: UpsertPostmortemInput) => apiSend<ContestPostmortem>('POST', `/contests/${id}/postmortem`, input),
  generateUpsolve: (id: string) => apiSend<UpsolveTask[]>('POST', `/contests/${id}/upsolve`, {}),
};

/** Competitive intelligence (Sprint 4) — /api/contest/* (singular). */
export const competitiveApi = {
  intelligence: (signal?: AbortSignal) => apiGet<CompetitiveIntelligence>('/contest/intelligence', signal),
  readiness: (signal?: AbortSignal) => apiGet<ContestReadiness>('/contest/readiness', signal),
  correlation: (signal?: AbortSignal) => apiGet<ContestCorrelation>('/contest/correlation', signal),
  insights: (signal?: AbortSignal) => apiGet<CompetitiveInsight[]>('/contest/insights', signal),
  ratingAnalysis: (signal?: AbortSignal) => apiGet<RatingAnalysis>('/contest/rating-analysis', signal),
};

export const upsolveApi = {
  list: (query: UpsolveQueryInput = {}, signal?: AbortSignal) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) p.set(k, String(v));
    const qs = p.toString();
    return apiGet<UpsolveTask[]>(`/upsolve${qs ? `?${qs}` : ''}`, signal);
  },
  queue: (signal?: AbortSignal) => apiGet<UpsolveQueue>('/upsolve/queue', signal),
  getById: (id: string, signal?: AbortSignal) => apiGet<UpsolveTask>(`/upsolve/${id}`, signal),
  update: (id: string, patch: UpdateUpsolveInput) => apiSend<UpsolveTask>('PATCH', `/upsolve/${id}`, patch),
};

export const ratingApi = {
  summary: (platform?: ContestPlatform, signal?: AbortSignal) =>
    apiGet<RatingSummary>(`/ratings${platform ? `?platform=${platform}` : ''}`, signal),
  history: (platform?: ContestPlatform, signal?: AbortSignal) =>
    apiGet<RatingHistoryPoint[]>(`/ratings/history${platform ? `?platform=${platform}` : ''}`, signal),
  current: (platform?: ContestPlatform, signal?: AbortSignal) =>
    apiGet<{ currentRating: number | null }>(`/ratings/current${platform ? `?platform=${platform}` : ''}`, signal),
};
