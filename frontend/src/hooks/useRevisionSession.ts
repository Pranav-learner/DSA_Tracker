import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { revisionSessionApi } from '@/api/revisionSession.api';
import { queryKeys } from '@/lib/queryClient';
import type {
  CompleteSessionInput,
  SessionHistoryQuery,
  StartSessionInput,
  UpdateSessionInput,
} from '@/types';

interface WorkspaceParams {
  scheduleId?: string;
  entityType?: string;
  entityId?: string;
}

const hasTarget = (p: WorkspaceParams) => Boolean(p.scheduleId || (p.entityType && p.entityId));

/** The revision workspace (knowledge content + active session + schedule). */
export function useRevisionWorkspace(params: WorkspaceParams) {
  return useQuery({
    queryKey: queryKeys.revisionWorkspace(params),
    queryFn: ({ signal }) => revisionSessionApi.workspace(params, signal),
    enabled: hasTarget(params),
  });
}

/** The user's active session (or null). Polls lightly so the timer stays honest. */
export function useActiveSession() {
  return useQuery({
    queryKey: queryKeys.revisionActiveSession,
    queryFn: ({ signal }) => revisionSessionApi.active(signal),
  });
}

/** Paginated, filterable session history. */
export function useSessionHistory(query: SessionHistoryQuery) {
  return useQuery({
    queryKey: queryKeys.revisionHistory(query),
    queryFn: ({ signal }) => revisionSessionApi.history(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** All sessions for one entity. */
export function useEntityHistory(entityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.revisionEntityHistory(entityId ?? ''),
    queryFn: ({ signal }) => revisionSessionApi.entityHistory(entityId as string, signal),
    enabled: Boolean(entityId),
  });
}

/** Invalidate every revision surface + the dashboard (which embeds the widget). */
function useInvalidateSession() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.revision });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useStartSession() {
  const invalidate = useInvalidateSession();
  return useMutation({
    mutationFn: (input: StartSessionInput) => revisionSessionApi.start(input),
    onSuccess: invalidate,
  });
}

export function useCompleteSession() {
  const invalidate = useInvalidateSession();
  return useMutation({
    mutationFn: (input: CompleteSessionInput) => revisionSessionApi.complete(input),
    onSuccess: invalidate,
  });
}

export function useUpdateSession() {
  const invalidate = useInvalidateSession();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateSessionInput }) =>
      revisionSessionApi.update(id, patch),
    onSuccess: invalidate,
  });
}
