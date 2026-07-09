import { Rocket } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { RETENTION_TONE_TEXT, scoreTone } from '@/lib/retention';
import { cn } from '@/lib/utils';

function label(score: number): { text: string; badge: 'success' | 'primary' | 'warning' | 'danger' } {
  if (score >= 80) return { text: 'Ready', badge: 'success' };
  if (score >= 60) return { text: 'Nearly ready', badge: 'primary' };
  if (score >= 40) return { text: 'Developing', badge: 'warning' };
  return { text: 'Early', badge: 'danger' };
}

/** A compact readiness read for the executive header. */
export function ReadinessCard({ score }: { score: number }) {
  const meta = label(score);
  return (
    <CardContainer className="flex items-center justify-between gap-3">
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Rocket className="size-3.5" /> Readiness
        </p>
        <p className={cn('text-2xl font-semibold tabular-nums', RETENTION_TONE_TEXT[scoreTone(score)])}>{score}%</p>
      </div>
      <Badge variant={meta.badge}>{meta.text}</Badge>
    </CardContainer>
  );
}
