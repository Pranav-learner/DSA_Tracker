import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RewardType, RewardSortOrder } from '@/types';

/**
 * Gamification UI state — the reward-history filters, sort order, date range and
 * dashboard preferences. **UI state only**; all progression figures are
 * server-owned by React Query. Mirrors the analytics slice's split.
 */
export interface GamificationUiState {
  /** Reward-history filters. */
  rewardTypeFilter: RewardType | null;
  /** Filter by originating activity type (rewardSource); null = all. */
  activityTypeFilter: string | null;
  sort: RewardSortOrder;
  from: string | null;
  to: string | null;
  /** Reward-history page size. */
  pageSize: number;
  /** Reward-history current page (0-based). */
  page: number;
  /** Whether the dashboard progression widgets are shown. */
  showDashboardWidgets: boolean;
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
} = gamificationSlice.actions;
export default gamificationSlice.reducer;
