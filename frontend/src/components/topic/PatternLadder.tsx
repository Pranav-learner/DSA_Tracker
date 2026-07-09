import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveStage } from '@/store/slices/topicSlice';
import { PATTERN_LADDER, placeholderStageState, type LadderStageState } from '@/lib/patternLadder';
import { PatternStageCard } from './PatternStageCard';
import type { LadderStageProgress } from '@/types';

/**
 * The Pattern Ladder — a reusable 6-stage progression rendered as a connected
 * vertical rail. When `ladder` (Sprint 3 progress) is supplied, stage state and
 * progress are real; otherwise a placeholder is shown. The expanded stage is
 * tracked in the topic Redux slice.
 */
export function PatternLadder({ ladder }: { ladder?: LadderStageProgress[] }) {
  const dispatch = useAppDispatch();
  const activeStageId = useAppSelector((s) => s.topic.activeStageId);

  const stateFor = (index: number): LadderStageState => {
    const real = ladder?.[index];
    if (!real) return placeholderStageState(index);
    return real.completed ? 'completed' : real.unlocked ? 'available' : 'locked';
  };

  return (
    <div className="relative space-y-3 before:absolute before:left-4 before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-border">
      {PATTERN_LADDER.map((stage, index) => (
        <div key={stage.id} className="relative">
          <PatternStageCard
            stage={stage}
            index={index}
            state={stateFor(index)}
            progressValue={ladder?.[index]?.progress}
            active={activeStageId === stage.id}
            onToggle={() => dispatch(setActiveStage(stage.id))}
          />
        </div>
      ))}
    </div>
  );
}
