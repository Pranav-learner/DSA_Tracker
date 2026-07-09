import { Gauge } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { ReadinessGauge } from './ReadinessGauge';
import { ScoreBars } from '@/components/reports';
import { READINESS_STATUS_META } from '@/lib/competitive';
import type { ContestReadiness } from '@/types';

/** Contest readiness — overall gauge + the six weighted sub-scores + areas. */
export function ContestReadinessCard({ readiness }: { readiness: ContestReadiness }) {
  const meta = READINESS_STATUS_META[readiness.status];
  return (
    <CardContainer className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><Gauge className="size-4 text-primary" /> Contest Readiness</h3>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
        <ReadinessGauge score={readiness.overall} />
        <div className="flex-1">
          <ScoreBars items={readiness.breakdown.map((b) => ({ label: b.label, score: b.score }))} />
        </div>
      </div>

      {(readiness.strongAreas.length > 0 || readiness.weakAreas.length > 0) && (
        <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Strong</p>
            <div className="flex flex-wrap gap-1.5">{readiness.strongAreas.length ? readiness.strongAreas.map((a) => <Badge key={a} variant="success">{a}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}</div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Needs work</p>
            <div className="flex flex-wrap gap-1.5">{readiness.weakAreas.length ? readiness.weakAreas.map((a) => <Badge key={a} variant="warning">{a}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}</div>
          </div>
        </div>
      )}
    </CardContainer>
  );
}
