import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge } from '@/components/analytics';
import { ACTION_LABEL } from '@/lib/competitive';
import type { CompetitiveRecommendation } from '@/types';

const IMPACT_VARIANT = { high: 'success', medium: 'primary', low: 'outline' } as const;

/** Prioritised, contest-aware recommendation list with routed action buttons. */
export function RecommendationPanel({ recommendations }: { recommendations: CompetitiveRecommendation[] }) {
  return (
    <CardContainer className="space-y-3">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" /> Recommendations</h3>
      {recommendations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recommendations right now — keep practising.</p>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((r) => (
            <li key={r.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={r.priority} />
                    <span className="font-medium">{r.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.reason}</p>
                </div>
                <Badge variant={IMPACT_VARIANT[r.learningImpact]}>{r.learningImpact} impact</Badge>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" /> ~{r.estimatedTimeMinutes} min</span>
                <Link to={r.to} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                  {ACTION_LABEL[r.actionType]} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}
