import { motion } from 'framer-motion';
import { Map, BookOpen, Calendar, Target, LayoutGrid, ListTree, EyeOff, Eye } from 'lucide-react';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setView, toggleHideLocked } from '@/store/slices/roadmapSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatCard } from '@/components/common/StatCard';
import { PhaseCard } from '@/components/common/PhaseCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Phase } from '@/types';

export function RoadmapPage() {
  const { data, isLoading, isError, error, refetch } = useRoadmap();
  const dispatch = useAppDispatch();
  const { view, hideLocked } = useAppSelector((s) => s.roadmap);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Learning Engine"
        title="Competitive Programming Roadmap"
        description="Eleven phases from environment setup to HFT-grade algorithm engineering. Progress unlocks the path ahead."
        icon={<Map className="size-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch(toggleHideLocked())}
              title={hideLocked ? 'Show locked phases' : 'Hide locked phases'}
            >
              {hideLocked ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              {hideLocked ? 'Show locked' : 'Focus mode'}
            </Button>
            <div className="flex rounded-md border border-border p-0.5">
              <button
                onClick={() => dispatch(setView('timeline'))}
                className={cn(
                  'flex size-8 items-center justify-center rounded transition-colors',
                  view === 'timeline' ? 'bg-accent text-foreground' : 'text-muted-foreground',
                )}
                aria-label="Timeline view"
              >
                <ListTree className="size-4" />
              </button>
              <button
                onClick={() => dispatch(setView('grid'))}
                className={cn(
                  'flex size-8 items-center justify-center rounded transition-colors',
                  view === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground',
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>
        }
      />

      {/* Summary strip */}
      {data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Phases"
            value={data.stats.totalPhases}
            hint={`${data.stats.unlockedPhases} available`}
            icon={<Map className="size-5" />}
          />
          <StatCard label="Topics" value={data.stats.totalTopics} icon={<BookOpen className="size-5" />} />
          <StatCard
            label="Est. Duration"
            value={`${data.stats.totalEstimatedWeeks} wks`}
            icon={<Calendar className="size-5" />}
          />
          <StatCard
            label="Problems"
            value={data.stats.totalEstimatedProblems}
            icon={<Target className="size-5" />}
          />
        </div>
      )}

      {isLoading && <LoadingSkeleton count={6} layout="grid" />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {data && <PhaseList phases={data.phases} view={view} hideLocked={hideLocked} />}
    </div>
  );
}

function PhaseList({
  phases,
  view,
  hideLocked,
}: {
  phases: Phase[];
  view: 'timeline' | 'grid';
  hideLocked: boolean;
}) {
  const visible = hideLocked ? phases.filter((p) => p.isUnlocked) : phases;

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No phases to show"
        description="Turn off focus mode to see locked phases, or run the backend seed script."
      />
    );
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((phase, i) => (
          <PhaseCard key={phase.id} phase={phase} index={i} />
        ))}
      </div>
    );
  }

  // Timeline view — vertical rail with connected phase cards.
  return (
    <div className="relative space-y-4 before:absolute before:left-[18px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border sm:before:left-[22px]">
      {visible.map((phase, i) => (
        <motion.div
          key={phase.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.4) }}
          className="relative pl-11 sm:pl-14"
        >
          <span
            className="absolute left-2 top-6 flex size-5 items-center justify-center rounded-full border-2 border-background sm:left-3"
            style={{ backgroundColor: phase.color }}
          />
          <PhaseCard phase={phase} index={i} />
        </motion.div>
      ))}
    </div>
  );
}
