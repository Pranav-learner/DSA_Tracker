import { Layers, BookOpen, Gauge, HeartHandshake, Brain, Flag } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { MasteryBar } from '@/components/learning/MasteryBar';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardGrid } from './DashboardGrid';
import { masteryTone } from '@/lib/mastery';
import type { DashboardRetention, OverallProgress, PhaseRef, TopicSummary } from '@/types';

/**
 * Progress Overview — where the learner stands: current phase/topic, completion,
 * mastery, confidence and retention in one grid. Reuses MasteryBar +
 * DashboardMetricCard; every figure is backend-computed.
 */
export function ProgressOverviewCard({
  overall,
  currentPhase,
  currentTopic,
  retention,
}: {
  overall: OverallProgress;
  currentPhase: PhaseRef | null;
  currentTopic: TopicSummary | null;
  retention: DashboardRetention;
}) {
  return (
    <div className="space-y-4">
      <CardContainer className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            {currentPhase && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Flag className="size-3.5" /> {currentPhase.title}
              </span>
            )}
            {currentTopic && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <BookOpen className="size-3.5 text-primary" /> {currentTopic.title}
                </span>
              </>
            )}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {overall.topicsCompleted}/{overall.topicsTotal} topics
          </span>
        </div>
        <MasteryBar value={overall.completionPercent} label="Overall completion" />
      </CardContainer>

      <DashboardGrid cols={4}>
        <DashboardMetricCard label="Completed" value={overall.topicsCompleted} icon={<BookOpen className="size-4" />} hint={`${overall.topicsRemaining} remaining`} />
        <DashboardMetricCard label="Phases" value={`${overall.phasesCompleted}/${overall.phasesTotal}`} icon={<Layers className="size-4" />} />
        <DashboardMetricCard label="Overall Mastery" value={`${overall.overallMastery}%`} icon={<Gauge className="size-4" />} tone={masteryTone(overall.overallMastery)} />
        <DashboardMetricCard label="Avg Confidence" value={`${overall.averageConfidence}%`} icon={<HeartHandshake className="size-4" />} tone={masteryTone(overall.averageConfidence)} />
        <DashboardMetricCard label="Avg Retention" value={`${retention.averageRetention}%`} icon={<Brain className="size-4" />} tone={masteryTone(retention.averageRetention)} />
        <DashboardMetricCard label="Success Rate" value={`${retention.revisionSuccessRate}%`} icon={<Gauge className="size-4" />} tone={masteryTone(retention.revisionSuccessRate)} />
      </DashboardGrid>
    </div>
  );
}
