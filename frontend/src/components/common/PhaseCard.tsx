import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Target, ArrowRight } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { StatusBadge } from './StatusBadge';
import { ProgressChip } from './ProgressChip';
import { Badge } from '@/components/ui/badge';
import { MasteryBar } from '@/components/learning/MasteryBar';
import { phaseStatusVariant } from '@/lib/mastery';
import { cn, plural } from '@/lib/utils';
import type { Phase, PhaseProgress } from '@/types';

interface PhaseCardProps {
  phase: Phase;
  /** Per-user progress overlay (Sprint 3). When present, drives status & mastery. */
  progress?: PhaseProgress;
  /** Zero-based position for staggered entrance animation. */
  index?: number;
}

const PHASE_STATUS_LABEL = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  locked: 'Locked',
} as const;

/** Roadmap phase card — the primary navigational unit of the roadmap page. */
export function PhaseCard({ phase, progress, index = 0 }: PhaseCardProps) {
  const navigate = useNavigate();
  const locked = progress ? progress.status === 'locked' : !phase.isUnlocked;

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/roadmap/${phase.id}`)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative flex w-full flex-col gap-4 overflow-hidden rounded-lg border border-border bg-card/60 p-5 text-left shadow-card backdrop-blur-sm transition-colors',
        'hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        locked && 'opacity-70',
      )}
    >
      {/* Accent rail in the phase's colour */}
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
              Phase {phase.order}
            </p>
            <h3 className="font-semibold leading-tight tracking-tight">{phase.title}</h3>
          </div>
        </div>
        {progress ? (
          <Badge variant={phaseStatusVariant(progress.status)}>
            {PHASE_STATUS_LABEL[progress.status]}
          </Badge>
        ) : (
          <StatusBadge isUnlocked={phase.isUnlocked} isCompleted={phase.isCompleted} />
        )}
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">{phase.description}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5" /> {plural(phase.topicCount, 'topic')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5" /> {plural(phase.estimatedWeeks, 'week')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Target className="size-3.5" /> {plural(phase.estimatedProblems, 'problem')}
        </span>
      </div>

      {progress ? (
        <div className="space-y-1.5">
          <MasteryBar value={progress.mastery} label="Mastery" />
          <p className="text-xs text-muted-foreground">
            {progress.topicsCompleted}/{progress.topicsTotal} topics · {progress.completionPercent}%
            complete
          </p>
        </div>
      ) : (
        <ProgressChip progress={phase.progress} />
      )}

      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        View phase <ArrowRight className="size-3.5" />
      </span>
    </motion.button>
  );
}
