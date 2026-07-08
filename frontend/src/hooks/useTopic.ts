import { useQuery } from '@tanstack/react-query';
import { topicApi } from '@/api/topic.api';
import { queryKeys } from '@/lib/queryClient';

/** Server state: a single topic by id. */
export function useTopic(topicId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topic(topicId ?? ''),
    queryFn: ({ signal }) => topicApi.getById(topicId as string, signal),
    enabled: Boolean(topicId),
  });
}
