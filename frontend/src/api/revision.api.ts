import { apiGet, apiSend } from './client';
import type {
  CreateScheduleInput,
  PaginatedRevisionSchedules,
  RevisionCalendar,
  RevisionQuery,
  RevisionQueue,
  RevisionSchedule,
  UpdateScheduleInput,
} from '@/types';

function toQueryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const revisionApi = {
  today: (signal?: AbortSignal) => apiGet<RevisionQueue>('/revision/today', signal),
  calendar: (range: { from?: string; to?: string }, signal?: AbortSignal) =>
    apiGet<RevisionCalendar>(`/revision/calendar${toQueryString(range)}`, signal),
  list: (query: RevisionQuery, signal?: AbortSignal) =>
    apiGet<PaginatedRevisionSchedules>(`/revision/schedules${toQueryString(query)}`, signal),
  getById: (id: string, signal?: AbortSignal) =>
    apiGet<RevisionSchedule>(`/revision/schedules/${id}`, signal),
  create: (input: CreateScheduleInput) =>
    apiSend<RevisionSchedule>('POST', '/revision/schedules', input),
  update: (id: string, patch: UpdateScheduleInput) =>
    apiSend<RevisionSchedule>('PATCH', `/revision/schedules/${id}`, patch),
  remove: (id: string) => apiSend<{ id: string; deleted: boolean }>('DELETE', `/revision/schedules/${id}`),
};
