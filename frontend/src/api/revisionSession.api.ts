import { apiGet, apiSend } from './client';
import type {
  CompleteSessionInput,
  PaginatedSessions,
  RevisionSession,
  RevisionWorkspace,
  SessionHistoryQuery,
  StartSessionInput,
  UpdateSessionInput,
} from '@/types';

function toQueryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const revisionSessionApi = {
  workspace: (params: { scheduleId?: string; entityType?: string; entityId?: string }, signal?: AbortSignal) =>
    apiGet<RevisionWorkspace>(`/revision/workspace${toQueryString(params)}`, signal),
  active: (signal?: AbortSignal) => apiGet<RevisionSession | null>('/revision/session/active', signal),
  getById: (id: string, signal?: AbortSignal) => apiGet<RevisionSession>(`/revision/session/${id}`, signal),
  history: (query: SessionHistoryQuery, signal?: AbortSignal) =>
    apiGet<PaginatedSessions>(`/revision/history${toQueryString(query)}`, signal),
  entityHistory: (entityId: string, signal?: AbortSignal) =>
    apiGet<RevisionSession[]>(`/revision/history/${encodeURIComponent(entityId)}`, signal),
  start: (input: StartSessionInput) => apiSend<RevisionSession>('POST', '/revision/session/start', input),
  complete: (input: CompleteSessionInput) => apiSend<RevisionSession>('POST', '/revision/session/complete', input),
  update: (id: string, patch: UpdateSessionInput) =>
    apiSend<RevisionSession>('PATCH', `/revision/session/${id}`, patch),
};
