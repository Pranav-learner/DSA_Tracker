import { configureStore } from '@reduxjs/toolkit';
import roadmapReducer from './slices/roadmapSlice';
import phaseReducer from './slices/phaseSlice';
import topicReducer from './slices/topicSlice';

/**
 * Redux store — holds **UI state only**. Server data (phases, topics) is owned
 * by React Query; this separation keeps caching/invalidation out of Redux.
 */
export const store = configureStore({
  reducer: {
    roadmap: roadmapReducer,
    phase: phaseReducer,
    topic: topicReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
