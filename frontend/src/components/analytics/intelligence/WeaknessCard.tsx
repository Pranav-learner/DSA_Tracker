import { Link } from 'react-router-dom';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { SeverityIndicator } from './SeverityIndicator';
import { SEVERITY_META } from '@/lib/intelligence';
import { cn } from '@/lib/utils';
import type { Weakness } from '@/types';

const SEVERITY_BORDER = {
  high: 'border-l-danger',
  medium: 'border-l-warning',
  low: 'border-l-border',
} as const;

/** A single weakness signal — severity, detail + a recommended next step. */
export function WeaknessCard({ weakness, className }: { weakness: Weakness; className?: string }) {
  return (
    <CardContainer className={cn('flex flex-col gap-2 border-l-4', SEVERITY_BORDER[weakness.severity], className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{weakness.title}</h3>
        <SeverityIndicator severity={weakness.severity} />
      </div>
      <p className="text-sm text-muted-foreground">{weakness.detail}</p>
      <p className="inline-flex items-start gap-1.5 text-xs text-primary">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
        {weakness.recommendationHint}
      </p>
      <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
        <span>
          {weakness.metric}: <span className={cn('font-semibold', SEVERITY_META[weakness.severity].tone === 'danger' ? 'text-danger' : 'text-warning')}>{weakness.value}</span> (target {weakness.threshold})
        </span>
        {weakness.entityId && weakness.entityType === 'topic' && (
          <Link to={`/topic/${weakness.entityId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
            Open <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
    </CardContainer>
  );
}
