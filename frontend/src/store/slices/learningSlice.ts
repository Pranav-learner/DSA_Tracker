import { createSlice } from '@reduxjs/toolkit';

/**
 * UI-only state for learning views. Server data (learning state, progress) is
 * owned by React Query — this holds display preferences only.
 */
interface LearningUiState {
  /** Compact dashboard layout toggle. */
  compactDashboard: boolean;
}

const initialState: LearningUiState = { compactDashboard: false };

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    toggleCompactDashboard(state) {
      state.compactDashboard = !state.compactDashboard;
    },
  },
});

export const { toggleCompactDashboard } = learningSlice.actions;
export default learningSlice.reducer;
