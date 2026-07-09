import { apiGet, apiSend } from './client';
import type { Attempt, AttemptSummary, CreateAttemptInput, UpdateAttemptInput } from '@/types';

export const attemptApi = {
  /** Attempt history for a problem (newest first). */
  listByProblem: (problemId: string, signal?: AbortSignal) =>
    apiGet<Attempt[]>(`/problems/${problemId}/attempts`, signal),
  /** Aggregated attempt stats for a problem. */
  summary: (problemId: string, signal?: AbortSignal) =>
    apiGet<AttemptSummary>(`/problems/${problemId}/summary`, signal),
  getById: (attemptId: string, signal?: AbortSignal) =>
    apiGet<Attempt>(`/attempts/${attemptId}`, signal),
  create: (input: CreateAttemptInput) => apiSend<Attempt>('POST', '/attempts', input),
  update: (attemptId: string, patch: UpdateAttemptInput) =>
    apiSend<Attempt>('PATCH', `/attempts/${attemptId}`, patch),
  remove: (attemptId: string) =>
    apiSend<{ id: string; deleted: boolean }>('DELETE', `/attempts/${attemptId}`),
};
