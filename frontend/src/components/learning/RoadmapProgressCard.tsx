import { MasteryRing } from './MasteryRing';
import { CardContainer } from '@/components/common/CardContainer';
import type { OverallProgress } from '@/types';

/** Hero progress card: mastery ring + completion headline. Reused in Analytics. */
export function RoadmapProgressCard({ overall }: { overall: OverallProgress }) {
  return (
    <CardContainer className="flex items-center gap-5">
      <MasteryRing value={overall.overallMastery} size={104} label="Mastery" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Roadmap Progress
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums leading-none">
          {overall.completionPercent}%
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {overall.topicsCompleted} of {overall.topicsTotal} topics ·{' '}
          {overall.phasesCompleted}/{overall.phasesTotal} phases
        </p>
      </div>
    </CardContainer>
  );
}
