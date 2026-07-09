import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ContestPlatform, ContestSortField, ContestType } from '@/types';

/**
 * Contest UI state — library filters, sorting and the selected platform/date
 * range. **UI state only**; all contest/rating server data is owned by React
 * Query.
 */
export interface ContestUiState {
  search: string;
  platform: ContestPlatform | null;
  contestType: ContestType | null;
  division: string | null;
  ratedOnly: boolean | null;
  from: string | null;
  to: string | null;
  sort: ContestSortField;
  order: 'asc' | 'desc';
  ratingPlatform: ContestPlatform | null;
  // --- Sprint 2: workspace UI ---
  selectedProblem: string | null;
  timelineFilter: string | null;
  problemStatusFilter: 'all' | 'solved' | 'attempted' | 'skipped';
}

const initialState: ContestUiState = {
  search: '',
  platform: null,
  contestType: null,
  division: null,
  ratedOnly: null,
  from: null,
  to: null,
  sort: 'startTime',
  order: 'desc',
  ratingPlatform: null,
  selectedProblem: null,
  timelineFilter: null,
  problemStatusFilter: 'all',
};

const contestSlice = createSlice({
  name: 'contest',
  initialState,
  reducers: {
    setContestSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setContestPlatform(state, action: PayloadAction<ContestPlatform | null>) {
      state.platform = state.platform === action.payload ? null : action.payload;
    },
    setContestType(state, action: PayloadAction<ContestType | null>) {
      state.contestType = state.contestType === action.payload ? null : action.payload;
    },
    setContestDivision(state, action: PayloadAction<string | null>) {
      state.division = state.division === action.payload ? null : action.payload;
    },
    setRatedOnly(state, action: PayloadAction<boolean | null>) {
      state.ratedOnly = action.payload;
    },
    setContestDateRange(state, action: PayloadAction<{ from: string | null; to: string | null }>) {
      state.from = action.payload.from;
      state.to = action.payload.to;
    },
    setContestSort(state, action: PayloadAction<{ sort: ContestSortField; order?: 'asc' | 'desc' }>) {
      if (state.sort === action.payload.sort && !action.payload.order) {
        state.order = state.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort = action.payload.sort;
        state.order = action.payload.order ?? 'desc';
      }
    },
    setRatingPlatform(state, action: PayloadAction<ContestPlatform | null>) {
      state.ratingPlatform = action.payload;
    },
    setSelectedProblem(state, action: PayloadAction<string | null>) {
      state.selectedProblem = state.selectedProblem === action.payload ? null : action.payload;
    },
    setTimelineFilter(state, action: PayloadAction<string | null>) {
      state.timelineFilter = state.timelineFilter === action.payload ? null : action.payload;
    },
    setProblemStatusFilter(state, action: PayloadAction<'all' | 'solved' | 'attempted' | 'skipped'>) {
      state.problemStatusFilter = action.payload;
    },
    resetContestFilters(state) {
      state.search = '';
      state.platform = null;
      state.contestType = null;
      state.division = null;
      state.ratedOnly = null;
      state.from = null;
      state.to = null;
    },
  },
});

export const {
  setContestSearch,
  setContestPlatform,
  setContestType,
  setContestDivision,
  setRatedOnly,
  setContestDateRange,
  setContestSort,
  setRatingPlatform,
  setSelectedProblem,
  setTimelineFilter,
  setProblemStatusFilter,
  resetContestFilters,
} = contestSlice.actions;
export default contestSlice.reducer;
