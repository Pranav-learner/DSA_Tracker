import { NotebookPen, Puzzle, Layers3, BookMarked, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardGrid } from './DashboardGrid';
import { CardContainer } from '@/components/common/CardContainer';
import { MasteryBar } from '@/components/learning/MasteryBar';
import type { DashboardKnowledge } from '@/types';

/**
 * Knowledge Summary — the learner's Module 2 second-brain at a glance:
 * entries, documented problems, patterns learned vs pending, and notebook
 * coverage of the roadmap. All figures come from the backend rollup.
 */
export function KnowledgeSummaryCard({ knowledge }: { knowledge: DashboardKnowledge }) {
  return (
    <div className="space-y-4">
      <CardContainer className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
            <NotebookPen className="size-4 text-primary" /> Notebook Coverage
          </h3>
          <Link to="/notebook" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <LinkIcon className="size-3" /> Open notebook
          </Link>
        </div>
        <MasteryBar value={knowledge.notebookCoveragePercent} label="Topics documented" />
        <p className="text-xs text-muted-foreground">
          {knowledge.topicsCovered} topics covered · {knowledge.patternsPending} patterns still to capture
        </p>
      </CardContainer>

      <DashboardGrid cols={4}>
        <DashboardMetricCard label="Knowledge Entries" value={knowledge.knowledgeEntries} icon={<NotebookPen className="size-4" />} />
        <DashboardMetricCard label="Problems" value={knowledge.representativeProblems} icon={<Puzzle className="size-4" />} />
        <DashboardMetricCard label="Patterns Learned" value={knowledge.patternsLearned} icon={<BookMarked className="size-4" />} tone="success" />
        <DashboardMetricCard label="Patterns Pending" value={knowledge.patternsPending} icon={<Layers3 className="size-4" />} tone={knowledge.patternsPending > 0 ? 'warning' : 'muted'} />
      </DashboardGrid>
    </div>
  );
}
