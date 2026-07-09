import { useParams } from 'react-router-dom';
import { BookOpen, Calendar, Target, Clock } from 'lucide-react';
import { usePhase, usePhaseTopics } from '@/hooks/usePhase';
import { useProgress } from '@/hooks/useLearning';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDifficultyFilter } from '@/store/slices/phaseSlice';
import { Icon } from '@/components/ui/Icon';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ProgressChip } from '@/components/common/ProgressChip';
import { TopicCard } from '@/components/common/TopicCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { CardContainer } from '@/components/common/CardContainer';
import { DIFFICULTIES } from '@/lib/difficulties';
import { cn } from '@/lib/utils';

export function PhasePage() {
  const { phaseId } = useParams<{ phaseId: string }>();
  const phaseQuery = usePhase(phaseId);
  const topicsQuery = usePhaseTopics(phaseId);
  const { data: progress } = useProgress();
  const dispatch = useAppDispatch();
  const difficultyFilter = useAppSelector((s) => s.phase.difficultyFilter);

  const overlayByTopic = new Map((progress?.topics ?? []).map((o) => [o.topicId, o]));

  if (phaseQuery.isError) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Roadmap', to: '/roadmap' }, { label: 'Phase' }]} />
        <ErrorState error={phaseQuery.error} onRetry={phaseQuery.refetch} />
      </div>
    );
  }

  const phase = phaseQuery.data;
  const topics = topicsQuery.data ?? [];
  const filtered = difficultyFilter ? topics.filter((t) => t.difficulty === difficultyFilter) : topics;

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: 'Roadmap', to: '/roadmap' },
          { label: phase ? `Phase ${phase.order}` : 'Phase' },
        ]}
      />

      {/* Header */}
      {phaseQuery.isLoading || !phase ? (
        <CardContainer className="h-40 animate-pulse" />
      ) : (
        <CardContainer className="relative overflow-hidden">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1"
            style={{ backgroundColor: phase.color }}
          />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex size-14 items-center justify-center rounded-xl border border-border"
                style={{ backgroundColor: `${phase.color}1a`, color: phase.color }}
              >
                <Icon name={phase.icon} className="size-7" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Phase {phase.order}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">{phase.title}</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{phase.description}</p>
              </div>
            </div>
            <StatusBadge isUnlocked={phase.isUnlocked} isCompleted={phase.isCompleted} />
          </div>
          <div className="mt-6 max-w-md">
            <ProgressChip progress={phase.progress} />
          </div>
        </CardContainer>
      )}

      {/* Stats */}
      {phase && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Topics" value={phase.topicCount} icon={<BookOpen className="size-5" />} />
          <StatCard
            label="Est. Weeks"
            value={phase.estimatedWeeks}
            icon={<Calendar className="size-5" />}
          />
          <StatCard
            label="Est. Problems"
            value={phase.estimatedProblems}
            icon={<Target className="size-5" />}
          />
          <StatCard
            label="Est. Hours"
            value={topics.reduce((sum, t) => sum + t.estimatedHours, 0)}
            hint="across all topics"
            icon={<Clock className="size-5" />}
          />
        </div>
      )}

      {/* Topics */}
      <div className="space-y-4">
        <SectionHeader
          title="Topics"
          description="Work through these in order — each builds on the last."
          action={
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterPill
                label="All"
                active={difficultyFilter === null}
                onClick={() => dispatch(setDifficultyFilter(null))}
              />
              {DIFFICULTIES.map((d) => (
                <FilterPill
                  key={d}
                  label={d}
                  active={difficultyFilter === d}
                  onClick={() => dispatch(setDifficultyFilter(d))}
                />
              ))}
            </div>
          }
        />

        {topicsQuery.isLoading && <LoadingSkeleton count={4} layout="grid" />}
        {topicsQuery.isError && (
          <ErrorState error={topicsQuery.error} onRetry={topicsQuery.refetch} />
        )}
        {topicsQuery.isSuccess &&
          (filtered.length === 0 ? (
            <EmptyState
              title={topics.length === 0 ? 'No topics yet' : 'No topics match this filter'}
              description={
                topics.length === 0
                  ? 'Run the backend seed script to populate this phase.'
                  : 'Try a different difficulty.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((topic, i) => (
                <TopicCard key={topic.id} topic={topic} overlay={overlayByTopic.get(topic.id)} index={i} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="focus-visible:outline-none">
      <Badge
        variant={active ? 'primary' : 'outline'}
        className={cn('cursor-pointer', active && 'ring-1 ring-primary/40')}
      >
        {label}
      </Badge>
    </button>
  );
}
