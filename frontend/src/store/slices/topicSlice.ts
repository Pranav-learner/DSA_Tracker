import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * UI-only state for the Topic Workspace. Kept intentionally minimal — server
 * data lives in React Query. Currently tracks which Pattern Ladder stage the
 * learner has focused (for the expanded detail panel).
 */
interface TopicUiState {
  /** Focused Pattern Ladder stage id, or null when none is expanded. */
  activeStageId: string | null;
}

const initialState: TopicUiState = {
  activeStageId: null,
};

const topicSlice = createSlice({
  name: 'topic',
  initialState,
  reducers: {
    setActiveStage(state, action: PayloadAction<string | null>) {
      // Toggle: selecting the active stage again collapses it.
      state.activeStageId = state.activeStageId === action.payload ? null : action.payload;
    },
    resetTopicUi(state) {
      state.activeStageId = null;
    },
  },
});

export const { setActiveStage, resetTopicUi } = topicSlice.actions;
export default topicSlice.reducer;
