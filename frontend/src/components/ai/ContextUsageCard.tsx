import { Database, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIContextSection } from '@/types';

interface ContextUsageCardProps {
  /** Section titles the coach drew on (its "sources used"). */
  sourcesUsed: string[];
  /** Optionally the full sections (for token totals). */
  sections?: AIContextSection[];
  tokenEstimate?: number;
  className?: string;
}

/**
 * ContextUsageCard — transparency for a coach turn: which context sources the
 * coach actually used to ground its answer (and roughly how much context). Makes
 * the "grounded in your progress" claim visible and auditable.
 */
export function ContextUsageCard({ sourcesUsed, sections, tokenEstimate, className }: ContextUsageCardProps) {
  const titles = sourcesUsed.length ? sourcesUsed : sections?.map((s) => s.title) ?? [];
  if (!titles.length) return null;

  return (
    <div className={cn('rounded-lg border border-border bg-background/40 p-3', className)}>
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Database className="size-3" /> Context used
        {typeof tokenEstimate === 'number' && (
          <span className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal">
            <Coins className="size-3" /> ~{tokenEstimate} tok
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {titles.map((t) => (
          <span key={t} className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-[11px] text-muted-foreground">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
