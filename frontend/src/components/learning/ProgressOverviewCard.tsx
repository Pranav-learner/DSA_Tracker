import { CheckCircle2, CircleDashed, Layers, Gauge, HeartHandshake } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { MasteryBar } from './MasteryBar';
import type { OverallProgress } from '@/types';

/** Overall roadmap progress: completion bar + key figures. Reused in Analytics. */
export function ProgressOverviewCard({ overall }: { overall: OverallProgress }) {
  return (
    <CardContainer className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Overall Progress
        </h3>
        <span className="text-sm font-medium text-muted-foreground">
          {overall.topicsCompleted}/{overall.topicsTotal} topics
        </span>
      </div>

      <MasteryBar value={overall.completionPercent} label="Completion" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric icon={<CheckCircle2 className="size-4" />} label="Completed" value={overall.topicsCompleted} />
        <Metric icon={<CircleDashed className="size-4" />} label="Remaining" value={overall.topicsRemaining} />
        <Metric icon={<Layers className="size-4" />} label="Phases Done" value={`${overall.phasesCompleted}/${overall.phasesTotal}`} />
        <Metric icon={<Gauge className="size-4" />} label="Avg Mastery" value={`${overall.averageTopicMastery}%`} />
        <Metric icon={<HeartHandshake className="size-4" />} label="Confidence" value={`${overall.averageConfidence}%`} />
        <Metric icon={<Gauge className="size-4" />} label="Overall Mastery" value={`${overall.overallMastery}%`} />
      </div>
    </CardContainer>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-accent/30 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">{icon}</div>
      <p className="text-lg font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
