import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RetentionLevel, RevisionEntityType } from '@/types';

export type RetentionTimeRange = '7d' | '14d' | '30d' | 'all';
export type RetentionChartMetric = 'confidence' | 'retention';

/**
 * Retention UI state — chart preferences (metric + time range), the overview
 * entity-type filter and an optional level filter. **UI state only**; all
 * retention/confidence server data is owned by React Query.
 */
export interface RetentionUiState {
  chartMetric: RetentionChartMetric;
  timeRange: RetentionTimeRange;
  entityFilter: RevisionEntityType | null;
  levelFilter: RetentionLevel | null;
}

const initialState: RetentionUiState = {
  chartMetric: 'confidence',
  timeRange: '14d',
  entityFilter: null,
  levelFilter: null,
};

const retentionSlice = createSlice({
  name: 'retention',
  initialState,
  reducers: {
    setChartMetric(state, action: PayloadAction<RetentionChartMetric>) {
      state.chartMetric = action.payload;
    },
    setTimeRange(state, action: PayloadAction<RetentionTimeRange>) {
      state.timeRange = action.payload;
    },
    setRetentionEntityFilter(state, action: PayloadAction<RevisionEntityType | null>) {
      state.entityFilter = action.payload;
    },
    setLevelFilter(state, action: PayloadAction<RetentionLevel | null>) {
      state.levelFilter = state.levelFilter === action.payload ? null : action.payload;
    },
  },
});

export const { setChartMetric, setTimeRange, setRetentionEntityFilter, setLevelFilter } =
  retentionSlice.actions;
export default retentionSlice.reducer;
