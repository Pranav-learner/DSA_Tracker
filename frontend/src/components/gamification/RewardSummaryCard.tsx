import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';

interface RewardSummaryCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: string;
  tone?: 'primary' | 'success' | 'warning' | 'amber' | 'muted';
  className?: string;
}

const TONE: Record<NonNullable<RewardSummaryCardProps['tone']>, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  amber: 'text-amber-400',
  muted: 'text-foreground',
};

/**
 * RewardSummaryCard — a compact stat tile (icon · label · value · hint) for the
 * gamification overview: achievements earned, badges, challenges completed, etc.
 * The atomic figure reused across the dashboard and profile.
 */
export function RewardSummaryCard({ label, value, icon, hint, tone = 'muted', className }: RewardSummaryCardProps) {
  return (
    <CardContainer className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={TONE[tone]}>{icon}</span>
      </div>
      <p className={cn('text-2xl font-semibold leading-none tabular-nums', TONE[tone])}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContainer>
  );
}
