import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type RoadmapView = 'timeline' | 'grid';

/** UI-only state for the roadmap page (server data lives in React Query). */
interface RoadmapUiState {
  view: RoadmapView;
  /** When true, dim/hide locked phases to focus on what's available. */
  hideLocked: boolean;
  /** Currently hovered/focused phase — drives subtle emphasis. */
  focusedPhaseId: string | null;
}

const initialState: RoadmapUiState = {
  view: 'timeline',
  hideLocked: false,
  focusedPhaseId: null,
};

const roadmapSlice = createSlice({
  name: 'roadmap',
  initialState,
  reducers: {
    setView(state, action: PayloadAction<RoadmapView>) {
      state.view = action.payload;
    },
    toggleHideLocked(state) {
      state.hideLocked = !state.hideLocked;
    },
    setFocusedPhase(state, action: PayloadAction<string | null>) {
      state.focusedPhaseId = action.payload;
    },
  },
});

export const { setView, toggleHideLocked, setFocusedPhase } = roadmapSlice.actions;
export default roadmapSlice.reducer;
