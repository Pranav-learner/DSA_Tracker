import { Link } from 'react-router-dom';
import { Brain, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { SEVERITY_META } from '@/lib/intelligence';
import { ANALYTICS_TONE_TEXT } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { AlgorithmGap } from '@/types';

/** Algorithm-gap analysis — missing algorithms / weak topics from the contest. */
export function AlgorithmGapCard({ gaps }: { gaps: AlgorithmGap[] }) {
  return (
    <CardContainer className="space-y-3">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><Brain className="size-4 text-primary" /> Algorithm Gaps</h3>
      {gaps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clear gaps — nice.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {gaps.map((g, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-medium">{g.label}</p>
                <p className="text-xs text-muted-foreground">{g.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={cn('text-xs font-medium', ANALYTICS_TONE_TEXT[SEVERITY_META[g.severity].tone])}>{SEVERITY_META[g.severity].label}</span>
                {g.topicId && (
                  <Link to={`/topic/${g.topicId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ArrowRight className="size-3" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}
