import { apiGet, apiSend } from './client';
import type {
  CreateNotebookInput,
  NotebookDetail,
  NotebookFacets,
  NotebookQuery,
  PaginatedNotebook,
  UpdateNotebookInput,
} from '@/types';

/** Serialise a notebook query into a URL query string (skips empty values). */
export function toNotebookQueryString(query: NotebookQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const notebookApi = {
  list: (query: NotebookQuery, signal?: AbortSignal) =>
    apiGet<PaginatedNotebook>(`/notebook${toNotebookQueryString(query)}`, signal),
  search: (query: NotebookQuery, signal?: AbortSignal) =>
    apiGet<PaginatedNotebook>(`/notebook/search${toNotebookQueryString(query)}`, signal),
  facets: (signal?: AbortSignal) => apiGet<NotebookFacets>('/notebook/facets', signal),
  getById: (id: string, signal?: AbortSignal) => apiGet<NotebookDetail>(`/notebook/${id}`, signal),
  create: (input: CreateNotebookInput) => apiSend<NotebookDetail>('POST', '/notebook', input),
  update: (id: string, patch: UpdateNotebookInput) =>
    apiSend<NotebookDetail>('PATCH', `/notebook/${id}`, patch),
  remove: (id: string) => apiSend<{ id: string; deleted: boolean }>('DELETE', `/notebook/${id}`),
};
