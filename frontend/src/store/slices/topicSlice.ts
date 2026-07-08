import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** Sections shown on the Topic page — each becomes a Sprint 2+ module. */
export type TopicSection =
  | 'concept'
  | 'pattern-ladder'
  | 'problems'
  | 'assessment'
  | 'notebook'
  | 'mastery';

interface TopicUiState {
  /** Which placeholder section is currently active on the topic page. */
  activeSection: TopicSection;
}

const initialState: TopicUiState = {
  activeSection: 'concept',
};

const topicSlice = createSlice({
  name: 'topic',
  initialState,
  reducers: {
    setActiveSection(state, action: PayloadAction<TopicSection>) {
      state.activeSection = action.payload;
    },
  },
});

export const { setActiveSection } = topicSlice.actions;
export default topicSlice.reducer;
