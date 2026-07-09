import { Badge } from '@/components/ui/badge';
import { verdictVariant } from '@/lib/attempts';
import type { AttemptVerdict } from '@/types';

/** Colour-coded judge-verdict pill (Accepted green, WA/RE/CE red, TLE/MLE amber). */
export function VerdictBadge({ verdict, className }: { verdict: AttemptVerdict; className?: string }) {
  return (
    <Badge variant={verdictVariant(verdict)} className={className}>
      {verdict}
    </Badge>
  );
}
