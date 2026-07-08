import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Map, BookOpen, Calendar, Target, Sparkles } from 'lucide-react';
import { useRoadmap } from '@/hooks/useRoadmap';
import { SectionHeader } from '@/components/common/SectionHeader';
import { StatCard } from '@/components/common/StatCard';
import { CardContainer } from '@/components/common/CardContainer';
import { PhaseCard } from '@/components/common/PhaseCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Icon } from '@/components/ui/Icon';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { plural } from '@/lib/utils';
import type { Phase } from '@/types';

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useRoadmap();

  // The "current" phase = first unlocked, not-completed phase (placeholder logic).
  const currentPhase = data?.phases.find((p) => p.isUnlocked && !p.isCompleted) ?? data?.phases[0];
  const previewPhases = data?.phases.slice(0, 3) ?? [];

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Welcome back"
        title="Your Learning Dashboard"
        description="Pick up where you left off and keep the momentum going."
        icon={<Sparkles className="size-5" />}
      />

      {isLoading && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardContainer key={i} className="h-20 animate-pulse" />
            ))}
          </div>
          <LoadingSkeleton count={3} layout="grid" />
        </>
      )}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Phases"
              value={data.stats.totalPhases}
              hint={`${data.stats.unlockedPhases} unlocked`}
              icon={<Map className="size-5" />}
            />
            <StatCard label="Topics" value={data.stats.totalTopics} icon={<BookOpen className="size-5" />} />
            <StatCard
              label="Roadmap"
              value={`${data.stats.totalEstimatedWeeks} wks`}
              icon={<Calendar className="size-5" />}
            />
            <StatCard
              label="Problems"
              value={data.stats.totalEstimatedProblems}
              icon={<Target className="size-5" />}
            />
          </div>

          {/* Continue learning */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ContinueCard phase={currentPhase} />
            <CardContainer className="flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Current Topic
                </p>
                <h3 className="mt-1 text-lg font-semibold">Not started yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open a phase and begin its first topic to see it tracked here.
                  <span className="text-muted-foreground/60"> (Progress tracking arrives in a later sprint.)</span>
                </p>
              </div>
              <Button variant="secondary" asChild className="w-fit">
                <Link to="/roadmap">
                  Browse roadmap <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContainer>
          </div>

          {/* Roadmap preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Roadmap Preview</h2>
              <Button variant="link" size="sm" asChild>
                <Link to="/roadmap">
                  View all {data.stats.totalPhases} phases <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {previewPhases.map((phase, i) => (
                <PhaseCard key={phase.id} phase={phase} index={i} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** "Continue Learning" hero card pointing at the current phase. */
function ContinueCard({ phase }: { phase: Phase | undefined }) {
  if (!phase) {
    return (
      <CardContainer className="flex flex-col justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current Phase
          </p>
          <h3 className="mt-1 text-lg font-semibold">Nothing here yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Seed the backend to populate your roadmap.
          </p>
        </div>
      </CardContainer>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <CardContainer
        interactive
        className="relative flex flex-col justify-between gap-4 overflow-hidden"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: phase.color }}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 items-center justify-center rounded-lg border border-border"
              style={{ backgroundColor: `${phase.color}1a`, color: phase.color }}
            >
              <Icon name={phase.icon} className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current Phase · Phase {phase.order}
              </p>
              <h3 className="text-lg font-semibold leading-tight">{phase.title}</h3>
            </div>
          </div>
          <StatusBadge isUnlocked={phase.isUnlocked} isCompleted={phase.isCompleted} />
        </div>
        <p className="text-sm text-muted-foreground">
          {plural(phase.topicCount, 'topic')} · {plural(phase.estimatedWeeks, 'week')} ·{' '}
          {plural(phase.estimatedProblems, 'problem')}
        </p>
        <Button asChild className="w-fit">
          <Link to={`/roadmap/${phase.id}`}>
            <Play className="size-4" /> Continue Learning
          </Link>
        </Button>
      </CardContainer>
    </motion.div>
  );
}
