import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Target, ArrowRight, Lock } from 'lucide-react';
import { DifficultyBadge } from './DifficultyBadge';
import { CompletionBadge } from '@/components/learning/CompletionBadge';
import { MasteryBar } from '@/components/learning/MasteryBar';
import { cn, plural } from '@/lib/utils';
import type { Topic, TopicOverlay } from '@/types';

interface TopicCardProps {
  topic: Topic;
  /** Per-user progress overlay (Sprint 3). When present, drives lock/mastery/status. */
  overlay?: TopicOverlay;
  index?: number;
}

/** Topic card shown in the phase's topics grid. */
export function TopicCard({ topic, overlay, index = 0 }: TopicCardProps) {
  const navigate = useNavigate();
  const locked = overlay ? !overlay.unlocked : !topic.isUnlocked;

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/topic/${topic.id}`)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.35) }}
      whileHover={{ y: -3 }}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 text-left shadow-card backdrop-blur-sm transition-colors',
        'hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        locked && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-accent text-xs font-medium tabular-nums text-muted-foreground">
            {topic.order + 1}
          </span>
          <h3 className="font-medium leading-tight">{topic.title}</h3>
        </div>
        {locked ? (
          <Lock className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          overlay && <CompletionBadge status={overlay.status} className="shrink-0" />
        )}
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">{topic.description}</p>

      {overlay && overlay.status !== 'Not Started' && (
        <MasteryBar value={overlay.mastery} label="Mastery" />
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <DifficultyBadge difficulty={topic.difficulty} />
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {plural(topic.estimatedHours, 'hr')}
        </span>
        <span className="inline-flex items-center gap-1">
          <Target className="size-3.5" /> {plural(topic.estimatedProblems, 'problem')}
        </span>
        <ArrowRight className="ml-auto size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </motion.button>
  );
}
