import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { MasteryTone } from '@/lib/mastery';

interface LearningInsightCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  /** Tints the icon tile + value (reuses the mastery tone scale). */
  tone?: MasteryTone;
  className?: string;
}

const TILE_TONE: Record<MasteryTone, string> = {
  success: 'bg-success/15 text-success',
  primary: 'bg-primary/15 text-primary',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-accent text-muted-foreground',
};

const TEXT_TONE: Record<MasteryTone, string> = {
  success: 'text-success',
  primary: 'text-foreground',
  warning: 'text-warning',
  muted: 'text-foreground',
};

/**
 * A single horizontal insight row (icon · label · value) for the right-side
 * Learning Insights panel. Deliberately reusable — every insight uses the same
 * shape so the panel reads as one system.
 */
export function LearningInsightCard({
  icon,
  label,
  value,
  hint,
  tone = 'muted',
  className,
}: LearningInsightCardProps) {
  return (
    <CardContainer className={cn('flex items-center gap-3 p-3.5', className)}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', TILE_TONE[tone])}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn('truncate text-sm font-semibold', TEXT_TONE[tone])}>{value}</p>
      </div>
      {hint && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{hint}</span>}
    </CardContainer>
  );
}
