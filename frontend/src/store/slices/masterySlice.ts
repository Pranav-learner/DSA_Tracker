import { createSlice } from '@reduxjs/toolkit';

/** UI-only state for mastery visualisations (the numbers come from the API). */
interface MasteryUiState {
  /** Whether the per-metric breakdown under the mastery ring is expanded. */
  showBreakdown: boolean;
}

const initialState: MasteryUiState = { showBreakdown: true };

const masterySlice = createSlice({
  name: 'mastery',
  initialState,
  reducers: {
    toggleBreakdown(state) {
      state.showBreakdown = !state.showBreakdown;
    },
  },
});

export const { toggleBreakdown } = masterySlice.actions;
export default masterySlice.reducer;
