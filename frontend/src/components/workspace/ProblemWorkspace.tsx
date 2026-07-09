import { Network } from 'lucide-react';
import { AttemptSummaryCard, AttemptHistory } from '@/components/attempts';
import { RelatedProblemCard } from '@/components/notebook';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { LearningImpactCard } from './LearningImpactCard';
import { KnowledgeNotebookCard } from './KnowledgeNotebookCard';
import { ActivityPanel } from './ActivityPanel';
import type { ProblemWorkspace as ProblemWorkspaceData } from '@/types';

/**
 * ProblemWorkspace — the integrated learner's workspace. Composes the reused
 * Attempt + Notebook engines with the new learning-integration surfaces
 * (impact, summary, recommendation, activity) into one premium layout.
 */
export function ProblemWorkspace({ workspace }: { workspace: ProblemWorkspaceData }) {
  const { problem, attemptSummary, notebook, learningStatus, learningImpact, relatedProblems, activity } = workspace;

  return (
    <div className="space-y-6">
      <WorkspaceHeader problem={problem} status={learningStatus} notebook={notebook} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 xl:col-span-2">
          <LearningImpactCard impact={learningImpact} />
          <AttemptSummaryCard problemId={problem.id} summary={attemptSummary} />
          <AttemptHistory problemId={problem.id} />
          <KnowledgeNotebookCard notebook={notebook} problemId={problem.id} />

          {relatedProblems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Network className="size-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Related Problems
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {relatedProblems.map((p, i) => (
                  <RelatedProblemCard key={p.id} problem={p} index={i} />
                ))}
              </div>
            </div>
          )}

          <ActivityPanel activity={activity} />
        </div>

        {/* Right rail */}
        <WorkspaceSidebar workspace={workspace} />
      </div>
    </div>
  );
}
