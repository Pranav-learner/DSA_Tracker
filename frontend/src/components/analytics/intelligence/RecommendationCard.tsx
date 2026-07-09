import { Link } from 'react-router-dom';
import { Clock, Zap, Play, RefreshCw, NotebookPen, BookOpen, type LucideIcon } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from './PriorityBadge';
import { IMPACT_TONE } from '@/lib/intelligence';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { AnalyticsRecommendation } from '@/types';

const ACTION_ICON: Record<AnalyticsRecommendation['actionType'], LucideIcon> = {
  'open-topic': BookOpen,
  'start-revision': RefreshCw,
  'review-notebook': NotebookPen,
  'practice-problems': Play,
};

/** An actionable recommendation — priority, reason, impact + a quick action. */
export function RecommendationCard({ recommendation, className }: { recommendation: AnalyticsRecommendation; className?: string }) {
  const Ico = ACTION_ICON[recommendation.actionType];
  return (
    <CardContainer className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{recommendation.title}</h3>
        <PriorityBadge priority={recommendation.priority} />
      </div>
      <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> ~{recommendation.estimatedTimeMinutes}m
        </span>
        <span className={cn('inline-flex items-center gap-1', ANALYTICS_TONE_TEXT[IMPACT_TONE[recommendation.learningImpact]])}>
          <Zap className="size-3.5" /> {recommendation.learningImpact} impact
        </span>
      </div>
      <Button asChild size="sm" variant="secondary" className="self-start">
        <Link to={recommendation.to}>
          <Ico className="size-4" /> {recommendation.suggestedAction}
        </Link>
      </Button>
    </CardContainer>
  );
}
