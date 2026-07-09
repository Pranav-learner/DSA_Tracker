import { apiGet } from './client';
import type { LearningState, LearningProgress, Recommendation } from '@/types';

export const learningApi = {
  state: (signal?: AbortSignal) => apiGet<LearningState>('/learning/state', signal),
};

export const progressApi = {
  get: (signal?: AbortSignal) => apiGet<LearningProgress>('/progress', signal),
};

export const recommendationApi = {
  get: (signal?: AbortSignal) => apiGet<Recommendation>('/recommendation', signal),
};
