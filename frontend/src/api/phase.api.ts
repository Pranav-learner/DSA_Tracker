import { apiGet } from './client';
import type { Phase, Topic } from '@/types';

export const phaseApi = {
  list: (signal?: AbortSignal) => apiGet<Phase[]>('/phases', signal),
  getById: (phaseId: string, signal?: AbortSignal) => apiGet<Phase>(`/phases/${phaseId}`, signal),
  topics: (phaseId: string, signal?: AbortSignal) =>
    apiGet<Topic[]>(`/phases/${phaseId}/topics`, signal),
};
