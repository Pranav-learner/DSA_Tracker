import { apiGet } from './client';
import type { Dashboard } from '@/types';

export const dashboardApi = {
  get: (signal?: AbortSignal) => apiGet<Dashboard>('/dashboard', signal),
};
