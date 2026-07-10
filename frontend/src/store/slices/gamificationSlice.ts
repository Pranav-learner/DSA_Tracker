import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RewardType, RewardSortOrder, AchievementRarity, ChallengeType, Celebration } from '@/types';

export type AchievementView = 'all' | 'unlocked' | 'locked';
export type AchievementSort = 'default' | 'progress' | 'rarity' | 'recent';

/**
 * Gamification UI state — reward-history filters, achievement filters/sort, the
 * challenge filter and the celebration queue/modal visibility. **UI state only**;
 * every figure is server-owned by React Query. Mirrors the analytics slice split.
 */
export interface GamificationUiState {
  /** Reward-history filters. */
  rewardTypeFilter: RewardType | null;
  activityTypeFilter: string | null;
  sort: RewardSortOrder;
  from: string | null;
  to: string | null;
  pageSize: number;
  page: number;
  showDashboardWidgets: boolean;

  /** Achievements page. */
  achievementCategory: string | null;
  achievementRarity: AchievementRarity | null;
  achievementView: AchievementView;
  achievementSort: AchievementSort;
  achievementSearch: string;

  /** Challenges page. */
  challengeTypeFilter: ChallengeType | null;

  /** Celebration system — the queue to show and the active modal. */
  celebrationQueue: Celebration[];
  activeCelebration: Celebration | null;
  /** Ids already surfaced this session (dedupes the queue). */
  shownCelebrationIds: string[];
}

const initialState: GamificationUiState = {
  rewardTypeFilter: null,
  activityTypeFilter: null,
  sort: 'newest',
  from: null,
  to: null,
  pageSize: 20,
  page: 0,
  showDashboardWidgets: true,

  achievementCategory: null,
  achievementRarity: null,
  achievementView: 'all',
  achievementSort: 'default',
  achievementSearch: '',

  challengeTypeFilter: null,

  celebrationQueue: [],
  activeCelebration: null,
  shownCelebrationIds: [],
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    setRewardTypeFilter(state, action: PayloadAction<RewardType | null>) {
      state.rewardTypeFilter = state.rewardTypeFilter === action.payload ? null : action.payload;
      state.page = 0;
    },
    setActivityTypeFilter(state, action: PayloadAction<string | null>) {
      state.activityTypeFilter = state.activityTypeFilter === action.payload ? null : action.payload;
      state.page = 0;
    },
    setSort(state, action: PayloadAction<RewardSortOrder>) {
      state.sort = action.payload;
      state.page = 0;
    },
    setDateRange(state, action: PayloadAction<{ from: string | null; to: string | null }>) {
      state.from = action.payload.from;
      state.to = action.payload.to;
      state.page = 0;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(0, action.payload);
    },
    resetFilters(state) {
      state.rewardTypeFilter = null;
      state.activityTypeFilter = null;
      state.sort = 'newest';
      state.from = null;
      state.to = null;
      state.page = 0;
    },
    toggleDashboardWidgets(state) {
      state.showDashboardWidgets = !state.showDashboardWidgets;
    },

    // --- Achievements page ---
    setAchievementCategory(state, action: PayloadAction<string | null>) {
      state.achievementCategory = state.achievementCategory === action.payload ? null : action.payload;
    },
    setAchievementRarity(state, action: PayloadAction<AchievementRarity | null>) {
      state.achievementRarity = state.achievementRarity === action.payload ? null : action.payload;
    },
    setAchievementView(state, action: PayloadAction<AchievementView>) {
      state.achievementView = action.payload;
    },
    setAchievementSort(state, action: PayloadAction<AchievementSort>) {
      state.achievementSort = action.payload;
    },
    setAchievementSearch(state, action: PayloadAction<string>) {
      state.achievementSearch = action.payload;
    },
    resetAchievementFilters(state) {
      state.achievementCategory = null;
      state.achievementRarity = null;
      state.achievementView = 'all';
      state.achievementSort = 'default';
      state.achievementSearch = '';
    },

    // --- Challenges page ---
    setChallengeTypeFilter(state, action: PayloadAction<ChallengeType | null>) {
      state.challengeTypeFilter = state.challengeTypeFilter === action.payload ? null : action.payload;
    },

    // --- Celebration queue ---
    /** Enqueue freshly-fetched celebrations not already shown this session. */
    enqueueCelebrations(state, action: PayloadAction<Celebration[]>) {
      const known = new Set([
        ...state.shownCelebrationIds,
        ...state.celebrationQueue.map((c) => c.id),
        ...(state.activeCelebration ? [state.activeCelebration.id] : []),
      ]);
      for (const c of action.payload) {
        if (!known.has(c.id)) state.celebrationQueue.push(c);
      }
    },
    /** Pop the next queued celebration into the active-modal slot. */
    advanceCelebration(state) {
      if (state.activeCelebration || state.celebrationQueue.length === 0) return;
      const next = state.celebrationQueue.shift()!;
      state.activeCelebration = next;
      state.shownCelebrationIds.push(next.id);
    },
    /** Dismiss the active celebration modal. */
    dismissCelebration(state) {
      state.activeCelebration = null;
    },
    clearCelebrations(state) {
      state.celebrationQueue = [];
      state.activeCelebration = null;
    },
  },
});

export const {
  setRewardTypeFilter,
  setActivityTypeFilter,
  setSort,
  setDateRange,
  setPage,
  resetFilters,
  toggleDashboardWidgets,
  setAchievementCategory,
  setAchievementRarity,
  setAchievementView,
  setAchievementSort,
  setAchievementSearch,
  resetAchievementFilters,
  setChallengeTypeFilter,
  enqueueCelebrations,
  advanceCelebration,
  dismissCelebration,
  clearCelebrations,
} = gamificationSlice.actions;
export default gamificationSlice.reducer;
