import { apiGet } from './client';
import type { Topic } from '@/types';

export const topicApi = {
  list: (signal?: AbortSignal) => apiGet<Topic[]>('/topics', signal),
  getById: (topicId: string, signal?: AbortSignal) => apiGet<Topic>(`/topics/${topicId}`, signal),
};
