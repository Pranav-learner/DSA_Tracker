import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, PlayCircle, ArrowRightCircle, ClipboardCheck, BookOpenCheck, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import type { Recommendation, RecommendationType } from '@/types';

const ICON: Record<RecommendationType, LucideIcon> = {
  'start-learning': Rocket,
  'continue-topic': PlayCircle,
  'complete-assessment': ClipboardCheck,
  'next-topic': ArrowRightCircle,
  'phase-reflection': BookOpenCheck,
};

/** Highlighted "next best action" card, driven by the RecommendationService. */
export function LearningRecommendationCard({
  recommendation,
  className,
}: {
  recommendation: Recommendation;
  className?: string;
}) {
  const Ico = ICON[recommendation.type] ?? Sparkles;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={className}>
      <CardContainer className="relative overflow-hidden border-primary/30 bg-primary/[0.06]">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Ico className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Recommended next
            </p>
            <h3 className="mt-0.5 font-semibold">{recommendation.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{recommendation.message}</p>
            <Button size="sm" asChild className="mt-3">
              <Link to={recommendation.actionTo}>
                {recommendation.actionLabel} <ArrowRightCircle className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContainer>
    </motion.div>
  );
}
