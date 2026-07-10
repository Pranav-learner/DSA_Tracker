import { apiGet, apiSend } from './client';
import type {
  ProgressionSummary,
  Reward,
  RewardHistoryPage,
  RewardHistoryQuery,
  Levels,
  Streaks,
  Achievement,
  AchievementsQuery,
  Badge,
  Challenge,
  ChallengesGrouped,
  Celebration,
  GamificationProfile,
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

  // --- Sprint 2: achievement system ---
  profile: (signal?: AbortSignal) => apiGet<GamificationProfile>('/gamification/profile', signal),
  achievements: (query: AchievementsQuery = {}, signal?: AbortSignal) =>
    apiGet<Achievement[]>(`/gamification/achievements${toQueryString(query)}`, signal),
  achievement: (id: string, signal?: AbortSignal) =>
    apiGet<Achievement>(`/gamification/achievements/${id}`, signal),
  badges: (signal?: AbortSignal) => apiGet<Badge[]>('/gamification/badges', signal),
  challenges: (signal?: AbortSignal) => apiGet<ChallengesGrouped>('/gamification/challenges', signal),
  patchChallenge: (id: string, action: 'refresh' | 'dismiss') =>
    apiSend<Challenge>('PATCH', `/gamification/challenges/${id}`, { action }),
  celebrations: (query: { unseen?: boolean; limit?: number } = {}, signal?: AbortSignal) =>
    apiGet<Celebration[]>(`/gamification/celebrations${toQueryString(query)}`, signal),
  markCelebrationsSeen: (ids?: string[]) =>
    apiSend<{ modified: number }>('POST', '/gamification/celebrations/seen', { ids }),
};
