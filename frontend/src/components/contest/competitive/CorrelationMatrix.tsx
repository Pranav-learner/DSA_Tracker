import { Link2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { CORRELATION_META } from '@/lib/competitive';
import { cn } from '@/lib/utils';
import type { ContestCorrelation } from '@/types';

/** The correlation matrix — each learning↔contest relationship with a verdict. */
export function CorrelationMatrix({ correlation }: { correlation: ContestCorrelation }) {
  return (
    <CardContainer className="space-y-3">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><Link2 className="size-4 text-primary" /> Performance Correlation</h3>
      <ul className="divide-y divide-border/60">
        {correlation.items.map((c) => {
          const meta = CORRELATION_META[c.direction];
          return (
            <li key={c.key} className="space-y-1 py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{c.label}</span>
                <Badge variant={meta.badge}>{meta.label} · {c.strength}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.insight}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{c.xLabel} <span className={cn('font-semibold tabular-nums text-primary')}>{c.xValue}%</span></span>
                <span className="text-muted-foreground/50">vs</span>
                <span>{c.yLabel} <span className="font-semibold tabular-nums text-success">{c.yValue}%</span></span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}
