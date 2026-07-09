import { CardContainer } from '@/components/common/CardContainer';
import { MATRIX_DIMENSIONS } from '@/lib/intelligence';
import { scoreTone } from '@/lib/retention';
import { RETENTION_TONE_TEXT } from '@/lib/retention';
import { HEALTH_BAR_CLASS } from '@/lib/health';
import { cn } from '@/lib/utils';
import type { HealthStatus, PatternMatrix as PatternMatrixData } from '@/types';

/** Map a 0–100 score to a bar colour via the shared health bar classes. */
function barClass(score: number): string {
  const status: HealthStatus = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'at-risk';
  return HEALTH_BAR_CLASS[status];
}

/**
 * PatternMatrix — the flagship Pattern Confidence Matrix: all eight dimensions
 * as labelled progress bars. Pure presentation of the backend matrix.
 */
export function PatternMatrix({ matrix, className }: { matrix: PatternMatrixData; className?: string }) {
  return (
    <CardContainer className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold">Pattern Confidence Matrix</h3>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {MATRIX_DIMENSIONS.map((d) => {
          const value = matrix[d.key];
          return (
            <div key={d.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {d.label}
                  {d.key === 'contestReadiness' && <span className="ml-1 text-[10px] text-muted-foreground/60">(preview)</span>}
                </span>
                <span className={cn('font-semibold tabular-nums', RETENTION_TONE_TEXT[scoreTone(value)])}>{value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', barClass(value))} style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </CardContainer>
  );
}
