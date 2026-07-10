import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TokenUsage } from '@/types';

interface TokenUsageCardProps {
  usage: TokenUsage;
  variant?: 'inline' | 'card';
  className?: string;
}

/**
 * TokenUsageCard — prompt / completion / total token accounting for a turn.
 * `inline` renders a compact chip (message footer); `card` renders a labelled box
 * (settings/telemetry).
 */
export function TokenUsageCard({ usage, variant = 'inline', className }: TokenUsageCardProps) {
  if (!usage.totalTokens) return null;

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground', className)} title={`${usage.promptTokens} prompt + ${usage.completionTokens} completion`}>
        <Coins className="size-3" />
        {usage.totalTokens} tokens
      </span>
    );
  }

  return (
    <div className={cn('grid grid-cols-3 gap-2 rounded-lg border border-border bg-card/60 p-3 text-center', className)}>
      <Stat label="Prompt" value={usage.promptTokens} />
      <Stat label="Completion" value={usage.completionTokens} />
      <Stat label="Total" value={usage.totalTokens} accent />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className={cn('text-lg font-semibold tabular-nums', accent && 'text-primary')}>{value.toLocaleString()}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
