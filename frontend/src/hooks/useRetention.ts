import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { retentionApi } from '@/api/retention.api';
import { queryKeys } from '@/lib/queryClient';
import type { RevisionEntityType, UpdateRetentionInput } from '@/types';

/** All retention profiles (optionally filtered by entity type). */
export function useRetentionProfiles(entityType?: RevisionEntityType | null) {
  const params = entityType ? { entityType } : {};
  return useQuery({
    queryKey: queryKeys.retentionList(params),
    queryFn: ({ signal }) => retentionApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

/** Aggregate retention + confidence overview (dashboard / overview card). */
export function useRetentionOverview() {
  return useQuery({
    queryKey: queryKeys.retentionOverview,
    queryFn: ({ signal }) => retentionApi.overview(signal),
  });
}

/** Recent retention snapshots across all entities. */
export function useRetentionHistory(limit = 40) {
  return useQuery({
    queryKey: queryKeys.retentionHistory({ limit }),
    queryFn: ({ signal }) => retentionApi.history({ limit }, signal),
    placeholderData: keepPreviousData,
  });
}

/** One entity's retention profile (topic workspace / notebook). */
export function useRetentionProfile(entityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.retentionEntity(entityId ?? ''),
    queryFn: ({ signal }) => retentionApi.byEntity(entityId as string, signal),
    enabled: Boolean(entityId),
  });
}

/** Confidence overview + per-entity confidence + trend. */
export function useConfidence() {
  return useQuery({
    queryKey: queryKeys.confidence,
    queryFn: ({ signal }) => retentionApi.confidence(signal),
  });
}

/** Manual confidence override — invalidates every retention surface + dashboard. */
export function useUpdateRetention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, patch }: { entityId: string; patch: UpdateRetentionInput }) =>
      retentionApi.update(entityId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.retention });
      qc.invalidateQueries({ queryKey: queryKeys.confidence });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
