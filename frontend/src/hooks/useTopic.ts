import { useQuery } from '@tanstack/react-query';
import { topicApi } from '@/api/topic.api';
import { queryKeys } from '@/lib/queryClient';

/** Server state: full topic workspace detail. */
export function useTopic(topicId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topic(topicId ?? ''),
    queryFn: ({ signal }) => topicApi.getById(topicId as string, signal),
    enabled: Boolean(topicId),
  });
}

/** Server state: prerequisites & related topics for the metadata panel. */
export function useTopicRelated(topicId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topicRelated(topicId ?? ''),
    queryFn: ({ signal }) => topicApi.related(topicId as string, signal),
    enabled: Boolean(topicId),
  });
}

/** Server state: read-only representative problems. */
export function useTopicProblems(topicId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.topicProblems(topicId ?? ''),
    queryFn: ({ signal }) => topicApi.problems(topicId as string, signal),
    enabled: Boolean(topicId),
  });
}
