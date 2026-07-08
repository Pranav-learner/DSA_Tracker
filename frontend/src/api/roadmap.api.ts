import { apiGet } from './client';
import type { Roadmap } from '@/types';

export const roadmapApi = {
  get: (signal?: AbortSignal) => apiGet<Roadmap>('/roadmap', signal),
};
