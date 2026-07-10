import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { gamificationApi } from '@/api/gamification.api';
import { queryKeys } from '@/lib/queryClient';
import type { RewardHistoryQuery, AchievementsQuery } from '@/types';

/**
 * Server state for the Progression Engine. All progression data is owned by
 * React Query (never Redux); the gamification Redux slice holds UI state only
 * (filters, date range, view preference).
 */

/** The learner's progression summary — XP, level, streak (dashboard + page). */
export function useProgression() {
  return useQuery({
    queryKey: queryKeys.progression,
    queryFn: ({ signal }) => gamificationApi.progression(signal),
  });
}

/** The most recent rewards (compact feed for the dashboard). */
export function useRecentRewards(limit = 6) {
  return useQuery({
    queryKey: queryKeys.rewards(limit),
    queryFn: ({ signal }) => gamificationApi.rewards(limit, signal),
  });
}

/** Filtered, paginated reward history. Previous page is kept while refetching. */
export function useRewardHistory(query: RewardHistoryQuery) {
  return useQuery({
    queryKey: queryKeys.rewardHistory(query),
    queryFn: ({ signal }) => gamificationApi.rewardHistory(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** The level ladder + the user's position on it. */
export function useLevels() {
  return useQuery({
    queryKey: queryKeys.levels,
    queryFn: ({ signal }) => gamificationApi.levels(signal),
  });
}

/** Streak detail + recent daily-activity breakdown. */
export function useStreaks() {
  return useQuery({
    queryKey: queryKeys.streaks,
    queryFn: ({ signal }) => gamificationApi.streaks(signal),
  });
}

/* ------------------------------------------------------------------ *
 *  Sprint 2 — achievements · badges · challenges · celebrations
 * ------------------------------------------------------------------ */

/** The unified gamification profile (dashboard + profile page). */
export function useGamificationProfile() {
  return useQuery({
    queryKey: queryKeys.gamificationProfile,
    queryFn: ({ signal }) => gamificationApi.profile(signal),
  });
}

/** The achievement catalogue with the user's progress (optionally filtered). */
export function useAchievements(query: AchievementsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.achievements(query),
    queryFn: ({ signal }) => gamificationApi.achievements(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single achievement by key. */
export function useAchievement(id: string) {
  return useQuery({
    queryKey: queryKeys.achievement(id),
    queryFn: ({ signal }) => gamificationApi.achievement(id, signal),
    enabled: Boolean(id),
  });
}

/** The user's badge collection. */
export function useBadges() {
  return useQuery({
    queryKey: queryKeys.badges,
    queryFn: ({ signal }) => gamificationApi.badges(signal),
  });
}

/** Active + completed challenges, grouped by cadence. */
export function useChallenges() {
  return useQuery({
    queryKey: queryKeys.challenges,
    queryFn: ({ signal }) => gamificationApi.challenges(signal),
  });
}

/** Refresh / dismiss a challenge. */
export function usePatchChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'refresh' | 'dismiss' }) =>
      gamificationApi.patchChallenge(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.challenges });
      qc.invalidateQueries({ queryKey: queryKeys.gamificationProfile });
    },
  });
}

/**
 * Recent celebrations. Polls on an interval so freshly-earned celebrations
 * surface as toasts/modals without a manual refetch (the queue is deduped
 * client-side via the gamification Redux slice).
 */
export function useCelebrations(query: { unseen?: boolean; limit?: number } = {}, options?: { poll?: boolean }) {
  return useQuery({
    queryKey: queryKeys.celebrations(query),
    queryFn: ({ signal }) => gamificationApi.celebrations(query, signal),
    refetchInterval: options?.poll ? 20_000 : false,
  });
}

/** Acknowledge celebrations the client has shown. */
export function useMarkCelebrationsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => gamificationApi.markCelebrationsSeen(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamification', 'celebrations'] });
      qc.invalidateQueries({ queryKey: queryKeys.gamificationProfile });
    },
  });
}
