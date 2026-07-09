import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { notebookApi } from '@/api/notebook.api';
import { queryKeys } from '@/lib/queryClient';
import { invalidateProblemLearning } from '@/lib/invalidate';
import type { CreateNotebookInput, NotebookListItem, NotebookQuery, UpdateNotebookInput } from '@/types';

/** Paginated, filtered notebook index. */
export function useNotebookList(query: NotebookQuery) {
  return useQuery({
    queryKey: queryKeys.notebookList(query),
    queryFn: ({ signal }) => notebookApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** A single notebook entry with resolved relationships. */
export function useNotebookEntry(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notebookEntry(id ?? ''),
    queryFn: ({ signal }) => notebookApi.getById(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Filter facets (patterns / platforms). Effectively static per session. */
export function useNotebookFacets() {
  return useQuery({
    queryKey: queryKeys.notebookFacets,
    queryFn: ({ signal }) => notebookApi.facets(signal),
    staleTime: Infinity,
  });
}

/** The notebook entry for a given problem, if one exists (for the problem page). */
export function useNotebookForProblem(problemId: string | undefined) {
  return useQuery<NotebookListItem | null>({
    queryKey: queryKeys.notebookByProblem(problemId ?? ''),
    queryFn: async ({ signal }) => {
      const page = await notebookApi.list({ problem: problemId, pageSize: 1 }, signal);
      return page.items[0] ?? null;
    },
    enabled: Boolean(problemId),
  });
}

function useInvalidateNotebook() {
  const qc = useQueryClient();
  return (id?: string, problemId?: string) => {
    // A notebook change affects the problem's workspace (learning status /
    // confidence), so sync the whole learning surface when we know the problem.
    if (problemId) {
      invalidateProblemLearning(qc, problemId);
    } else {
      qc.invalidateQueries({ queryKey: queryKeys.notebook });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    }
    if (id) qc.invalidateQueries({ queryKey: queryKeys.notebookEntry(id) });
  };
}

export function useCreateNotebook() {
  const invalidate = useInvalidateNotebook();
  return useMutation({
    mutationFn: (input: CreateNotebookInput) => notebookApi.create(input),
    onSuccess: (entry) => invalidate(entry.id, entry.problemId),
  });
}

export function useUpdateNotebook() {
  const invalidate = useInvalidateNotebook();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateNotebookInput }) =>
      notebookApi.update(id, patch),
    onSuccess: (entry) => invalidate(entry.id, entry.problemId),
  });
}

export function useDeleteNotebook() {
  const invalidate = useInvalidateNotebook();
  return useMutation({
    mutationFn: (id: string) => notebookApi.remove(id),
    onSuccess: (_res, id) => invalidate(id),
  });
}
