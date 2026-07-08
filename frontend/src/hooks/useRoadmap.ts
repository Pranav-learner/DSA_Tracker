import { useQuery } from '@tanstack/react-query';
import { roadmapApi } from '@/api/roadmap.api';
import { queryKeys } from '@/lib/queryClient';

/** Server state: the full roadmap (phases + stats + progress). */
export function useRoadmap() {
  return useQuery({
    queryKey: queryKeys.roadmap,
    queryFn: ({ signal }) => roadmapApi.get(signal),
  });
}
