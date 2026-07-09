import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, CircleDashed, HeartHandshake } from 'lucide-react';
import { useRoadmap } from '@/hooks/useRoadmap';
import { useLearningState, useProgress } from '@/hooks/useLearning';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatCard } from '@/components/common/StatCard';
import { PhaseCard } from '@/components/common/PhaseCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RoadmapProgressCard } from '@/components/learning/RoadmapProgressCard';
import { LearningRecommendationCard } from '@/components/learning/LearningRecommendationCard';
import { CurrentTopicCard } from '@/components/learning/CurrentTopicCard';
import { ProgressOverviewCard } from '@/components/learning/ProgressOverviewCard';
import type { PhaseProgress } from '@/types';

export function DashboardPage() {
  const stateQuery = useLearningState();
  const { data: progress } = useProgress();
  const { data: roadmap } = useRoadmap();

  const progressByPhase = new Map<string, PhaseProgress>(
    (progress?.phases ?? []).map((p) => [p.phaseId, p]),
  );
  const previewPhases = roadmap?.phases.slice(0, 3) ?? [];

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Welcome back"
        title="Your Learning Dashboard"
        description="Your live position, mastery and next best action — all driven by the Learning Engine."
        icon={<Sparkles className="size-5" />}
      />

      {stateQuery.isLoading && <DashboardSkeleton />}
      {stateQuery.isError && <ErrorState error={stateQuery.error} onRetry={stateQuery.refetch} />}

      {stateQuery.data && (
        <>
          {/* Progress + recommendation */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RoadmapProgressCard overall={stateQuery.data.overall} />
            <LearningRecommendationCard recommendation={stateQuery.data.recommendation} />
          </div>

          {/* Current topic + overall figures */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CurrentTopicCard
              topic={stateQuery.data.currentTopic}
              mastery={stateQuery.data.currentMastery}
              stage={stateQuery.data.currentStage}
              phaseTitle={stateQuery.data.currentPhase?.title}
            />
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="Completed"
                value={stateQuery.data.overall.topicsCompleted}
                icon={<CheckCircle2 className="size-5" />}
              />
              <StatCard
                label="Remaining"
                value={stateQuery.data.overall.topicsRemaining}
                icon={<CircleDashed className="size-5" />}
              />
              <StatCard
                label="Confidence"
                value={`${stateQuery.data.overall.averageConfidence}%`}
                icon={<HeartHandshake className="size-5" />}
              />
            </div>
          </div>

          <ProgressOverviewCard overall={stateQuery.data.overall} />

          {/* Roadmap preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Roadmap Preview</h2>
              <Button variant="link" size="sm" asChild>
                <Link to="/roadmap">
                  View full roadmap <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            {previewPhases.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {previewPhases.map((phase, i) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    progress={progressByPhase.get(phase.id)}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <LoadingSkeleton count={3} layout="grid" />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
