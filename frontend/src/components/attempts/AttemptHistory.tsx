import { useState } from 'react';
import { Plus, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContainer } from '@/components/common/CardContainer';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/api/client';
import {
  useProblemAttempts,
  useCreateAttempt,
  useUpdateAttempt,
  useDeleteAttempt,
} from '@/hooks/useAttempts';
import { AttemptTimeline } from './AttemptTimeline';
import { AttemptForm, type AttemptFormPayload } from './AttemptForm';
import { plural } from '@/lib/utils';
import type { Attempt } from '@/types';

/**
 * Attempt History section — the full journey plus the log/edit/delete flow.
 * Owns the form modal and mutations; the timeline + summary refresh via React
 * Query invalidation.
 */
export function AttemptHistory({ problemId }: { problemId: string }) {
  const { data: attempts, isLoading, isError, error, refetch } = useProblemAttempts(problemId);
  const createMutation = useCreateAttempt(problemId);
  const updateMutation = useUpdateAttempt(problemId);
  const deleteMutation = useDeleteAttempt(problemId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Attempt | null>(null);
  const [serverError, setServerError] = useState<string | undefined>();

  const openCreate = () => {
    setEditing(null);
    setServerError(undefined);
    setFormOpen(true);
  };
  const openEdit = (attempt: Attempt) => {
    setEditing(attempt);
    setServerError(undefined);
    setFormOpen(true);
  };

  const onError = (e: unknown) =>
    setServerError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

  const handleSubmit = (payload: AttemptFormPayload) => {
    setServerError(undefined);
    if (editing) {
      updateMutation.mutate(
        { attemptId: editing.id, patch: payload },
        { onSuccess: () => setFormOpen(false), onError },
      );
    } else {
      createMutation.mutate(
        { problemId, ...payload },
        { onSuccess: () => setFormOpen(false), onError },
      );
    }
  };

  const handleDelete = (attempt: Attempt) => {
    if (!window.confirm(`Delete attempt #${attempt.attemptNumber}? This can't be undone.`)) return;
    deleteMutation.mutate(attempt.id);
  };

  const count = attempts?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Attempt History
          </h2>
          {count > 0 && (
            <span className="text-xs text-muted-foreground">· {plural(count, 'attempt')}</span>
          )}
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" /> Log attempt
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : count === 0 ? (
        <EmptyState
          icon={<History className="size-6" />}
          title="No attempts yet"
          description="Log your first attempt to start recording this problem's solving journey."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> Log your first attempt
            </Button>
          }
        />
      ) : (
        <AttemptTimeline attempts={attempts!} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {deleteMutation.isError && (
        <CardContainer className="border-danger/40 bg-danger/5 text-sm text-danger">
          Couldn't delete that attempt. Please try again.
        </CardContainer>
      )}

      <AttemptForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        attempt={editing}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={serverError}
      />
    </div>
  );
}
