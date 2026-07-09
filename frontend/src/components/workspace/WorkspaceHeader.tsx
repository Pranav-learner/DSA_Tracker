import { ProblemHeader } from '@/components/problems';
import { QuickActionBar } from './QuickActionBar';
import type { NotebookRefLite, ProblemDetail, ProblemLearningStatus } from '@/types';

/**
 * WorkspaceHeader — the problem's identity (reused ProblemHeader) plus the
 * QuickActionBar with the live learning status.
 */
export function WorkspaceHeader({
  problem,
  status,
  notebook,
}: {
  problem: ProblemDetail;
  status: ProblemLearningStatus;
  notebook: NotebookRefLite | null;
}) {
  return (
    <div className="space-y-4">
      <ProblemHeader problem={problem} />
      <QuickActionBar problem={problem} status={status} notebook={notebook} />
    </div>
  );
}
