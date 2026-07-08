import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Target,
  Lightbulb,
  ListOrdered,
  Code2,
  ClipboardCheck,
  NotebookPen,
  Trophy,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTopic } from '@/hooks/useTopic';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveSection, type TopicSection } from '@/store/slices/topicSlice';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CardContainer } from '@/components/common/CardContainer';
import { StatCard } from '@/components/common/StatCard';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn, plural } from '@/lib/utils';

interface SectionDef {
  key: TopicSection;
  label: string;
  icon: LucideIcon;
  blurb: string;
  sprint: string;
}

/** The six future modules, shown as placeholders in Sprint 1. */
const SECTIONS: SectionDef[] = [
  {
    key: 'concept',
    label: 'Concept',
    icon: Lightbulb,
    blurb: 'Curated explanations, intuition and prerequisite links for this topic.',
    sprint: 'Sprint 2',
  },
  {
    key: 'pattern-ladder',
    label: 'Pattern Ladder',
    icon: ListOrdered,
    blurb: 'A progression of patterns from fundamentals to advanced variations.',
    sprint: 'Sprint 2',
  },
  {
    key: 'problems',
    label: 'Problems',
    icon: Code2,
    blurb: 'Hand-picked problems mapped to each pattern, with difficulty ramps.',
    sprint: 'Sprint 3',
  },
  {
    key: 'assessment',
    label: 'Assessment',
    icon: ClipboardCheck,
    blurb: 'Timed checkpoints that gauge readiness before unlocking the next topic.',
    sprint: 'Sprint 4',
  },
  {
    key: 'notebook',
    label: 'Notebook',
    icon: NotebookPen,
    blurb: 'Your personal notes, templates and reflections for this topic.',
    sprint: 'Sprint 4',
  },
  {
    key: 'mastery',
    label: 'Mastery',
    icon: Trophy,
    blurb: 'A live mastery score computed from problems solved and retention.',
    sprint: 'Sprint 5',
  },
];

export function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const { data: topic, isLoading, isError, error, refetch } = useTopic(topicId);
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector((s) => s.topic.activeSection);

  if (isError) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Roadmap', to: '/roadmap' }, { label: 'Topic' }]} />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const active = SECTIONS.find((s) => s.key === activeSection) ?? SECTIONS[0];

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: 'Roadmap', to: '/roadmap' },
          ...(topic ? [{ label: 'Phase', to: `/roadmap/${topic.phaseId}` }] : []),
          { label: topic?.title ?? 'Topic' },
        ]}
      />

      {/* Header */}
      {isLoading || !topic ? (
        <CardContainer className="space-y-4">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContainer>
      ) : (
        <CardContainer>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <DifficultyBadge difficulty={topic.difficulty} />
                <StatusBadge isUnlocked={topic.isUnlocked} isCompleted={topic.isCompleted} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{topic.title}</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{topic.description}</p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link to={`/roadmap/${topic.phaseId}`}>
                <ArrowLeft className="size-4" /> Back to phase
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Difficulty" value={topic.difficulty} />
            <StatCard
              label="Est. Hours"
              value={plural(topic.estimatedHours, 'hr')}
              icon={<Clock className="size-5" />}
            />
            <StatCard
              label="Est. Problems"
              value={topic.estimatedProblems}
              icon={<Target className="size-5" />}
            />
          </div>
        </CardContainer>
      )}

      {/* Module section tabs */}
      <div>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((section) => {
            const Ico = section.icon;
            const isActive = section.key === activeSection;
            return (
              <button
                key={section.key}
                onClick={() => dispatch(setActiveSection(section.key))}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Ico className="size-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Active section — placeholder content only in Sprint 1 */}
        <motion.div
          key={active.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4"
        >
          <CardContainer className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
              <active.icon className="size-7" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{active.label}</h2>
              <Badge variant="outline">
                <Lock className="size-3" /> {active.sprint}
              </Badge>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">{active.blurb}</p>
            <p className="text-xs text-muted-foreground/70">
              This module is a placeholder in Sprint 1 and will be built in a future sprint.
            </p>
          </CardContainer>
        </motion.div>
      </div>
    </div>
  );
}
