import { TrendingUp, AlertTriangle, Flag, Sparkle, type LucideIcon } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { INSIGHT_TONE } from '@/lib/intelligence';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { InsightType, LearningInsight } from '@/types';

const ICON: Record<InsightType, LucideIcon> = {
  trend: TrendingUp,
  weakness: AlertTriangle,
  strength: Sparkle,
  milestone: Flag,
};

/** One dynamic insight in the feed — icon-toned by sentiment. */
export function InsightCard({ insight, className }: { insight: LearningInsight; className?: string }) {
  const Ico = ICON[insight.type];
  const tone = INSIGHT_TONE[insight.tone];
  return (
    <CardContainer className={cn('flex items-start gap-3', className)}>
      <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent', ANALYTICS_TONE_TEXT[tone])}>
        <Ico className="size-4" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="font-semibold leading-snug">{insight.title}</p>
        <p className="text-sm text-muted-foreground">{insight.message}</p>
      </div>
    </CardContainer>
  );
}
