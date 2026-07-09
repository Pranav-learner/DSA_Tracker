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
  /** Collapsible dashboard sections currently expanded (by id). */
  collapsedSections: string[];
  /** Preferred distribution chart style. */
  distributionChart: 'pie' | 'bar';
  /** Selected pattern on the Pattern Intelligence page (null = none). */
  selectedPattern: string | null;
  /** Weakness/strength severity filter (null = all). */
  severityFilter: 'high' | 'medium' | 'low' | null;
}

const initialState: AnalyticsUiState = {
  range: '30d',
  from: null,
  to: null,
  comparison: false,
  view: 'grid',
  scopeFilter: null,
  collapsedSections: [],
  distributionChart: 'pie',
  selectedPattern: null,
  severityFilter: null,
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
    toggleSection(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.collapsedSections = state.collapsedSections.includes(id)
        ? state.collapsedSections.filter((s) => s !== id)
        : [...state.collapsedSections, id];
    },
    setDistributionChart(state, action: PayloadAction<'pie' | 'bar'>) {
      state.distributionChart = action.payload;
    },
    setSelectedPattern(state, action: PayloadAction<string | null>) {
      state.selectedPattern = state.selectedPattern === action.payload ? null : action.payload;
    },
    setSeverityFilter(state, action: PayloadAction<'high' | 'medium' | 'low' | null>) {
      state.severityFilter = state.severityFilter === action.payload ? null : action.payload;
    },
  },
});

export const {
  setRange,
  setCustomRange,
  toggleComparison,
  setView,
  setScopeFilter,
  toggleSection,
  setDistributionChart,
  setSelectedPattern,
  setSeverityFilter,
} = analyticsSlice.actions;
export default analyticsSlice.reducer;
