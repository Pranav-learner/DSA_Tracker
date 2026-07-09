import { LearningSummaryCard } from './LearningSummaryCard';
import { RecommendationPanel } from './RecommendationPanel';
import { IntegrationStatusCard } from './IntegrationStatusCard';
import type { ProblemWorkspace } from '@/types';

/** The workspace's right rail: learning summary, recommendation, integration status. */
export function WorkspaceSidebar({ workspace }: { workspace: ProblemWorkspace }) {
  return (
    <aside className="space-y-4">
      <LearningSummaryCard summary={workspace.learningSummary} />
      <RecommendationPanel recommendation={workspace.learningSummary.recommendation} />
      <IntegrationStatusCard
        status={workspace.learningStatus}
        impact={workspace.learningImpact}
        notebook={workspace.notebook}
        attemptCount={workspace.attemptSummary.totalAttempts}
      />
    </aside>
  );
}
