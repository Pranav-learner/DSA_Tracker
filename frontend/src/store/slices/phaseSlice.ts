import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Difficulty } from '@/types';

/** UI-only state for the phase detail page. */
interface PhaseUiState {
  /** Filter topics by difficulty; null = all. */
  difficultyFilter: Difficulty | null;
}

const initialState: PhaseUiState = {
  difficultyFilter: null,
};

const phaseSlice = createSlice({
  name: 'phase',
  initialState,
  reducers: {
    setDifficultyFilter(state, action: PayloadAction<Difficulty | null>) {
      state.difficultyFilter = action.payload;
    },
    resetPhaseFilters(state) {
      state.difficultyFilter = null;
    },
  },
});

export const { setDifficultyFilter, resetPhaseFilters } = phaseSlice.actions;
export default phaseSlice.reducer;
