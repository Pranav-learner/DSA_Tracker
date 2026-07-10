import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { gamificationApi } from '@/api/gamification.api';
import { queryKeys } from '@/lib/queryClient';
import type { RewardHistoryQuery } from '@/types';

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
