import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { Strength } from '@/types';

/** A single strength signal — a positive, reinforcing read. */
export function StrengthCard({ strength, className }: { strength: Strength; className?: string }) {
  return (
    <CardContainer className={cn('flex flex-col gap-2 border-l-4 border-l-success', className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-semibold leading-snug">
          <CheckCircle2 className="size-4 shrink-0 text-success" />
          {strength.title}
        </h3>
        <span className="text-sm font-semibold tabular-nums text-success">{strength.value}</span>
      </div>
      <p className="text-sm text-muted-foreground">{strength.detail}</p>
      {strength.entityId && strength.entityType === 'topic' && (
        <Link to={`/topic/${strength.entityId}`} className="inline-flex items-center gap-1 self-start text-xs text-primary hover:underline">
          Open <ArrowRight className="size-3" />
        </Link>
      )}
    </CardContainer>
  );
}
