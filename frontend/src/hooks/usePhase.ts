import { useQuery } from '@tanstack/react-query';
import { phaseApi } from '@/api/phase.api';
import { queryKeys } from '@/lib/queryClient';

/** Server state: a single phase by id. */
export function usePhase(phaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.phase(phaseId ?? ''),
    queryFn: ({ signal }) => phaseApi.getById(phaseId as string, signal),
    enabled: Boolean(phaseId),
  });
}

/** Server state: topics belonging to a phase. */
export function usePhaseTopics(phaseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.phaseTopics(phaseId ?? ''),
    queryFn: ({ signal }) => phaseApi.topics(phaseId as string, signal),
    enabled: Boolean(phaseId),
  });
}
