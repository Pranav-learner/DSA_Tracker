import { configureStore } from '@reduxjs/toolkit';
import roadmapReducer from './slices/roadmapSlice';
import phaseReducer from './slices/phaseSlice';
import topicReducer from './slices/topicSlice';
import learningReducer from './slices/learningSlice';
import masteryReducer from './slices/masterySlice';
import recommendationReducer from './slices/recommendationSlice';
import progressUiReducer from './slices/progressSlice';
import problemsReducer from './slices/problemsSlice';
import notebookReducer from './slices/notebookSlice';
import revisionReducer from './slices/revisionSlice';
import retentionReducer from './slices/retentionSlice';

/**
 * Redux store — holds **UI state only**. Server data (phases, topics) is owned
 * by React Query; this separation keeps caching/invalidation out of Redux.
 */
export const store = configureStore({
  reducer: {
    roadmap: roadmapReducer,
    phase: phaseReducer,
    topic: topicReducer,
    learning: learningReducer,
    mastery: masteryReducer,
    recommendation: recommendationReducer,
    progressUi: progressUiReducer,
    problems: problemsReducer,
    notebook: notebookReducer,
    revision: revisionReducer,
    retention: retentionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
