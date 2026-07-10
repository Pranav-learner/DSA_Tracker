import { apiGet } from './client';
import type {
  ProgressionSummary,
  Reward,
  RewardHistoryPage,
  RewardHistoryQuery,
  Levels,
  Streaks,
} from '@/types';

function toQueryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Client for the Gamification / Progression Engine (all read-only endpoints). */
export const gamificationApi = {
  progression: (signal?: AbortSignal) =>
    apiGet<ProgressionSummary>('/gamification/progression', signal),
  rewards: (limit = 10, signal?: AbortSignal) =>
    apiGet<Reward[]>(`/gamification/rewards${toQueryString({ limit })}`, signal),
  rewardHistory: (query: RewardHistoryQuery, signal?: AbortSignal) =>
    apiGet<RewardHistoryPage>(`/gamification/rewards/history${toQueryString(query)}`, signal),
  levels: (signal?: AbortSignal) => apiGet<Levels>('/gamification/levels', signal),
  streaks: (signal?: AbortSignal) => apiGet<Streaks>('/gamification/streaks', signal),
};
