import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Flag } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { MasteryRing } from './MasteryRing';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { STAGE_LABELS } from '@/lib/mastery';
import type { LadderStage, TopicSummary } from '@/types';

interface CurrentTopicCardProps {
  topic: TopicSummary | null;
  mastery: number;
  stage: LadderStage | null;
  phaseTitle?: string;
}

/** "Where am I" card — current topic, its mastery ring and a continue action. */
export function CurrentTopicCard({ topic, mastery, stage, phaseTitle }: CurrentTopicCardProps) {
  if (!topic) {
    return (
      <EmptyState
        title="No active topic"
        description="Start a topic from the roadmap to see it tracked here."
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <CardContainer className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <MasteryRing value={mastery} size={96} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current Topic{phaseTitle ? ` · ${phaseTitle}` : ''}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold leading-tight">{topic.title}</h3>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <DifficultyBadge difficulty={topic.difficulty} />
            {stage && (
              <Badge variant="primary">
                <Flag className="size-3" /> {STAGE_LABELS[stage]}
              </Badge>
            )}
          </div>
          <Button size="sm" asChild className="mt-3">
            <Link to={`/topic/${topic.id}`}>
              <Play className="size-4" /> Continue Learning
            </Link>
          </Button>
        </div>
      </CardContainer>
    </motion.div>
  );
}
