import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AnalyticsRange } from '@/types';

export type AnalyticsRangeSelection = AnalyticsRange | 'custom';
export type AnalyticsView = 'grid' | 'list';

/**
 * Analytics UI state — the selected date range / custom bounds, comparison mode,
 * scope filters and view preference. **UI state only**; every analytics figure
 * is server-owned by React Query.
 */
export interface AnalyticsUiState {
  range: AnalyticsRangeSelection;
  from: string | null;
  to: string | null;
  comparison: boolean;
  view: AnalyticsView;
  /** Optional scope focus on the overview page (null = show all). */
  scopeFilter: string | null;
}

const initialState: AnalyticsUiState = {
  range: '30d',
  from: null,
  to: null,
  comparison: false,
  view: 'grid',
  scopeFilter: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setRange(state, action: PayloadAction<AnalyticsRangeSelection>) {
      state.range = action.payload;
      if (action.payload !== 'custom') {
        state.from = null;
        state.to = null;
      }
    },
    setCustomRange(state, action: PayloadAction<{ from: string | null; to: string | null }>) {
      state.range = 'custom';
      state.from = action.payload.from;
      state.to = action.payload.to;
    },
    toggleComparison(state) {
      state.comparison = !state.comparison;
    },
    setView(state, action: PayloadAction<AnalyticsView>) {
      state.view = action.payload;
    },
    setScopeFilter(state, action: PayloadAction<string | null>) {
      state.scopeFilter = state.scopeFilter === action.payload ? null : action.payload;
    },
  },
});

export const { setRange, setCustomRange, toggleComparison, setView, setScopeFilter } = analyticsSlice.actions;
export default analyticsSlice.reducer;
