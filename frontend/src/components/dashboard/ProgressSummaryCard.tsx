import { CheckCircle2, CircleDashed, Gauge, HeartHandshake, Layers, Trophy } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { MasteryBar } from '@/components/learning/MasteryBar';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardGrid } from './DashboardGrid';
import { masteryTone } from '@/lib/mastery';
import type { OverallProgress } from '@/types';

/**
 * Learning Progress overview — headline completion bar plus a grid of the key
 * figures (completed / remaining / mastery / confidence). Reuses the shared
 * MasteryBar and DashboardMetricCard so every number reads consistently.
 */
export function ProgressSummaryCard({ overall }: { overall: OverallProgress }) {
  return (
    <div className="space-y-4">
      <CardContainer className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Overall Progress
          </h3>
          <span className="text-sm font-medium text-muted-foreground">
            {overall.topicsCompleted}/{overall.topicsTotal} topics
          </span>
        </div>
        <MasteryBar value={overall.completionPercent} label="Completion" />
      </CardContainer>

      <DashboardGrid cols={3}>
        <DashboardMetricCard
          label="Topics Completed"
          value={overall.topicsCompleted}
          icon={<CheckCircle2 className="size-4" />}
          hint={`of ${overall.topicsTotal}`}
        />
        <DashboardMetricCard
          label="Topics Remaining"
          value={overall.topicsRemaining}
          icon={<CircleDashed className="size-4" />}
          hint={`${overall.phasesCompleted}/${overall.phasesTotal} phases done`}
        />
        <DashboardMetricCard
          label="Phases Done"
          value={`${overall.phasesCompleted}/${overall.phasesTotal}`}
          icon={<Layers className="size-4" />}
        />
        <DashboardMetricCard
          label="Average Mastery"
          value={`${overall.averageTopicMastery}%`}
          icon={<Gauge className="size-4" />}
          tone={masteryTone(overall.averageTopicMastery)}
        />
        <DashboardMetricCard
          label="Average Confidence"
          value={`${overall.averageConfidence}%`}
          icon={<HeartHandshake className="size-4" />}
          tone={masteryTone(overall.averageConfidence)}
        />
        <DashboardMetricCard
          label="Overall Mastery"
          value={`${overall.overallMastery}%`}
          icon={<Trophy className="size-4" />}
          tone={masteryTone(overall.overallMastery)}
        />
      </DashboardGrid>
    </div>
  );
}
