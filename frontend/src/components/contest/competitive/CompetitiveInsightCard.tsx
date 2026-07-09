import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Lightbulb, Sparkle, Target, Flag, ArrowRight, type LucideIcon } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { SeverityIndicator } from '@/components/analytics';
import { INSIGHT_TYPE_META } from '@/lib/competitive';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { CompetitiveInsight, CompetitiveInsightType } from '@/types';

const ICON: Record<CompetitiveInsightType, LucideIcon> = {
  strength: Sparkle,
  improvement: TrendingUp,
  opportunity: Lightbulb,
  focus: Target,
  weakness: AlertTriangle,
  warning: Flag,
};

/** One competitive insight — severity · reason · suggested action · related topics. */
export function CompetitiveInsightCard({ insight, className }: { insight: CompetitiveInsight; className?: string }) {
  const Ico = ICON[insight.type];
  const tone = INSIGHT_TYPE_META[insight.type].tone;
  return (
    <CardContainer className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-semibold leading-snug">
          <span className={cn('shrink-0', ANALYTICS_TONE_TEXT[tone])}><Ico className="size-4" /></span>
          {insight.title}
        </h3>
        <SeverityIndicator severity={insight.severity} showLabel={false} />
      </div>
      <p className="text-sm text-muted-foreground">{insight.reason}</p>
      <p className="inline-flex items-start gap-1.5 text-xs text-primary"><Lightbulb className="mt-0.5 size-3.5 shrink-0" /> {insight.suggestedAction}</p>
      {insight.relatedTopics.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-2">
          {insight.relatedTopics.map((t) => (
            <Link key={t.id} to={`/topic/${t.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              {t.title} <ArrowRight className="size-3" />
            </Link>
          ))}
        </div>
      )}
    </CardContainer>
  );
}
