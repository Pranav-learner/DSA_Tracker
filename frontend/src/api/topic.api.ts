import { apiGet, apiSend } from './client';
import type {
  Topic,
  TopicDetail,
  TopicRelations,
  RepresentativeProblem,
  TopicProgress,
  Mastery,
  TopicSummary,
  MasteryMetrics,
} from '@/types';

export const topicApi = {
  list: (signal?: AbortSignal) => apiGet<Topic[]>('/topics', signal),
  getById: (topicId: string, signal?: AbortSignal) =>
    apiGet<TopicDetail>(`/topics/${topicId}`, signal),
  related: (topicId: string, signal?: AbortSignal) =>
    apiGet<TopicRelations>(`/topics/${topicId}/related`, signal),
  problems: (topicId: string, signal?: AbortSignal) =>
    apiGet<RepresentativeProblem[]>(`/topics/${topicId}/problems`, signal),

  // --- Sprint 3: per-user learning engine ---
  unlocked: (signal?: AbortSignal) => apiGet<TopicSummary[]>('/topics/unlocked', signal),
  progress: (topicId: string, signal?: AbortSignal) =>
    apiGet<TopicProgress>(`/topics/${topicId}/progress`, signal),
  patchProgress: (topicId: string, patch: Partial<MasteryMetrics>) =>
    apiSend<TopicProgress>('PATCH', `/topics/${topicId}/progress`, patch),
  mastery: (topicId: string, signal?: AbortSignal) =>
    apiGet<Mastery>(`/topics/${topicId}/mastery`, signal),
  patchMastery: (topicId: string, patch: Partial<MasteryMetrics>) =>
    apiSend<Mastery>('PATCH', `/topics/${topicId}/mastery`, patch),
  unlock: (topicId: string) => apiSend<TopicSummary>('POST', `/topics/${topicId}/unlock`),
};
