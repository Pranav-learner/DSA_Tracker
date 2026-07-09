import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { revisionApi } from '@/api/revision.api';
import { queryKeys } from '@/lib/queryClient';
import type { CreateScheduleInput, RevisionQuery, UpdateScheduleInput } from '@/types';

/** Today's revision queue (overdue / due / upcoming + summary). */
export function useRevisionToday() {
  return useQuery({
    queryKey: queryKeys.revisionToday,
    queryFn: ({ signal }) => revisionApi.today(signal),
  });
}

/** Revision events grouped by date for a month range. */
export function useRevisionCalendar(range: { from?: string; to?: string }) {
  return useQuery({
    queryKey: queryKeys.revisionCalendar(range),
    queryFn: ({ signal }) => revisionApi.calendar(range, signal),
    placeholderData: keepPreviousData,
  });
}

/** Paginated, filtered schedules. */
export function useRevisionSchedules(query: RevisionQuery) {
  return useQuery({
    queryKey: queryKeys.revisionSchedules(query),
    queryFn: ({ signal }) => revisionApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single schedule. */
export function useRevisionSchedule(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.revisionSchedule(id ?? ''),
    queryFn: ({ signal }) => revisionApi.getById(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Invalidate every revision surface + the dashboard (which embeds the widget). */
function useInvalidateRevision() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.revision });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useCreateSchedule() {
  const invalidate = useInvalidateRevision();
  return useMutation({
    mutationFn: (input: CreateScheduleInput) => revisionApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateSchedule() {
  const invalidate = useInvalidateRevision();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateScheduleInput }) =>
      revisionApi.update(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteSchedule() {
  const invalidate = useInvalidateRevision();
  return useMutation({
    mutationFn: (id: string) => revisionApi.remove(id),
    onSuccess: invalidate,
  });
}
