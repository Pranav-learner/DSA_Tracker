import { apiGet, apiSend } from './client';
import type {
  ConfidenceOverview,
  RetentionHistoryRow,
  RetentionOverview,
  RetentionProfile,
  UpdateRetentionInput,
} from '@/types';

function toQueryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const retentionApi = {
  list: (params: { entityType?: string } = {}, signal?: AbortSignal) =>
    apiGet<RetentionProfile[]>(`/retention${toQueryString(params)}`, signal),
  overview: (signal?: AbortSignal) => apiGet<RetentionOverview>('/retention/overview', signal),
  history: (params: { limit?: number } = {}, signal?: AbortSignal) =>
    apiGet<RetentionHistoryRow[]>(`/retention/history${toQueryString(params)}`, signal),
  byEntity: (entityId: string, signal?: AbortSignal) =>
    apiGet<RetentionProfile>(`/retention/${encodeURIComponent(entityId)}`, signal),
  confidence: (signal?: AbortSignal) => apiGet<ConfidenceOverview>('/confidence', signal),
  update: (entityId: string, patch: UpdateRetentionInput) =>
    apiSend<RetentionProfile>('PATCH', `/retention/${encodeURIComponent(entityId)}`, patch),
};
