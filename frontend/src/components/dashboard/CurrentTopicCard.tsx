import { motion } from 'framer-motion';
import { BookOpen, Flag, Clock, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { MasteryRing } from '@/components/learning/MasteryRing';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { QuickActionButton } from './QuickActionButton';
import { STAGE_LABELS, LADDER_STAGE_ORDER } from '@/lib/mastery';
import { formatHours } from '@/lib/utils';
import type { LadderStage, TopicSummary } from '@/types';

interface CurrentTopicCardProps {
  topic: TopicSummary | null;
  mastery: number;
  stage: LadderStage | null;
  phaseTitle?: string;
}

/**
 * The active-topic panel: mastery ring, current stage, pattern-ladder position,
 * estimated study time and an "Open Topic" action. All values come from the
 * backend dashboard payload.
 */
export function CurrentTopicCard({ topic, mastery, stage, phaseTitle }: CurrentTopicCardProps) {
  if (!topic) {
    return (
      <EmptyState
        icon={<BookOpen className="size-6" />}
        title="No active topic"
        description="Start a topic from the roadmap to see it tracked here."
      />
    );
  }

  const ladderPosition = stage ? LADDER_STAGE_ORDER.indexOf(stage) + 1 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <CardContainer className="flex h-full flex-col">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Current Topic{phaseTitle ? ` · ${phaseTitle}` : ''}
        </p>

        <div className="mt-3 flex items-center gap-4">
          <MasteryRing value={mastery} size={84} />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight">{topic.title}</h3>
            <div className="mt-1.5">
              <DifficultyBadge difficulty={topic.difficulty} />
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          <Field icon={<Flag className="size-3.5" />} label="Stage" value={stage ? STAGE_LABELS[stage] : '—'} />
          <Field
            icon={<BookOpen className="size-3.5" />}
            label="Ladder"
            value={ladderPosition ? `${ladderPosition} / ${LADDER_STAGE_ORDER.length}` : '—'}
          />
          <Field icon={<Clock className="size-3.5" />} label="Est. time" value={formatHours(topic.estimatedHours)} />
        </dl>

        <QuickActionButton
          to={`/topic/${topic.id}`}
          label="Open Topic"
          trailingIcon={<ArrowRight className="size-4" />}
          size="sm"
          variant="secondary"
          className="mt-4 self-start"
        />
      </CardContainer>
    </motion.div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-accent/30 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}</div>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
