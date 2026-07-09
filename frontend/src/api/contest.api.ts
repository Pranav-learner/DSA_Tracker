import { apiGet, apiSend } from './client';
import type {
  Contest,
  ContestFacets,
  ContestPlatform,
  ContestQuery,
  ContestStats,
  CreateContestInput,
  PaginatedContests,
  RatingHistoryPoint,
  RatingSummary,
  UpdateContestInput,
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

export const ratingApi = {
  summary: (platform?: ContestPlatform, signal?: AbortSignal) =>
    apiGet<RatingSummary>(`/ratings${platform ? `?platform=${platform}` : ''}`, signal),
  history: (platform?: ContestPlatform, signal?: AbortSignal) =>
    apiGet<RatingHistoryPoint[]>(`/ratings/history${platform ? `?platform=${platform}` : ''}`, signal),
  current: (platform?: ContestPlatform, signal?: AbortSignal) =>
    apiGet<{ currentRating: number | null }>(`/ratings/current${platform ? `?platform=${platform}` : ''}`, signal),
};
