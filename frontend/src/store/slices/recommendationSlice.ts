import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * UI-only state for recommendations. The recommendation itself comes from the
 * API; this only tracks which ones the user has dismissed this session.
 */
interface RecommendationUiState {
  dismissedTypes: string[];
}

const initialState: RecommendationUiState = { dismissedTypes: [] };

const recommendationSlice = createSlice({
  name: 'recommendation',
  initialState,
  reducers: {
    dismiss(state, action: PayloadAction<string>) {
      if (!state.dismissedTypes.includes(action.payload)) {
        state.dismissedTypes.push(action.payload);
      }
    },
    clearDismissed(state) {
      state.dismissedTypes = [];
    },
  },
});

export const { dismiss, clearDismissed } = recommendationSlice.actions;
export default recommendationSlice.reducer;
