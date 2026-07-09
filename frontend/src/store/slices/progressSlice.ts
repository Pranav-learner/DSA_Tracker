import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** UI-only state for progress views (figures come from the API). */
interface ProgressUiState {
  /** Which phase's progress breakdown is expanded in an overview, if any. */
  expandedPhaseId: string | null;
}

const initialState: ProgressUiState = { expandedPhaseId: null };

const progressSlice = createSlice({
  name: 'progressUi',
  initialState,
  reducers: {
    toggleExpandedPhase(state, action: PayloadAction<string>) {
      state.expandedPhaseId = state.expandedPhaseId === action.payload ? null : action.payload;
    },
  },
});

export const { toggleExpandedPhase } = progressSlice.actions;
export default progressSlice.reducer;
