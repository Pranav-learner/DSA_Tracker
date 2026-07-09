import { motion } from 'framer-motion';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { Badge } from '@/components/ui/badge';
import { QuickActionButton } from './QuickActionButton';
import { formatHours } from '@/lib/utils';
import type { Recommendation, TopicSummary } from '@/types';

interface TodaysLearningCardProps {
  recommendation: Recommendation | null;
  /** The topic the recommendation points at (for name / difficulty / time). */
  topic: TopicSummary | null;
  className?: string;
}

/**
 * "Today's Learning" — the recommended next action rendered richly: topic,
 * reason, estimated study time, difficulty and a continue button. Driven by the
 * backend RecommendationService. Falls back gracefully when none exists.
 */
export function TodaysLearningCard({ recommendation, topic, className }: TodaysLearningCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={className}>
      <CardContainer className="relative flex h-full flex-col overflow-hidden border-primary/25 bg-primary/[0.05]">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />

        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Today's Learning</span>
        </div>

        {recommendation ? (
          <div className="mt-3 flex flex-1 flex-col">
            <h3 className="text-lg font-semibold leading-tight">
              {topic?.title ?? recommendation.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{recommendation.message}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {topic && <DifficultyBadge difficulty={topic.difficulty} />}
              {topic && (
                <Badge variant="outline">
                  <Clock className="size-3" /> ~{formatHours(topic.estimatedHours)} study
                </Badge>
              )}
            </div>

            <QuickActionButton
              to={recommendation.actionTo}
              label={recommendation.actionLabel}
              trailingIcon={<ArrowRight className="size-4" />}
              size="sm"
              className="mt-4 self-start"
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No recommendation available.</p>
        )}
      </CardContainer>
    </motion.div>
  );
}
