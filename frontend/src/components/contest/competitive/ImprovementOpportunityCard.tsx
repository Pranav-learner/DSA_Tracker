import { Link } from 'react-router-dom';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { SeverityIndicator } from '@/components/analytics';
import type { CompetitiveInsight } from '@/types';

/** A single improvement opportunity — the highest-leverage gaps to close next. */
export function ImprovementOpportunityCard({ insight }: { insight: CompetitiveInsight }) {
  const target = insight.relatedTopics[0];
  return (
    <CardContainer className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <h4 className="inline-flex items-center gap-2 text-sm font-semibold leading-snug"><TrendingUp className="size-4 shrink-0 text-primary" /> {insight.title}</h4>
        <SeverityIndicator severity={insight.severity} showLabel={false} />
      </div>
      <p className="text-xs text-muted-foreground">{insight.reason}</p>
      <p className="text-xs text-primary">{insight.suggestedAction}</p>
      {target && (
        <Link to={`/topic/${target.id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {target.title} <ArrowUpRight className="size-3.5" />
        </Link>
      )}
    </CardContainer>
  );
}
