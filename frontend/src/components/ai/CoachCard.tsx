import { Check } from 'lucide-react';
import { coachIcon } from '@/lib/coachIcons';
import { cn } from '@/lib/utils';
import type { CoachMeta } from '@/types';

interface CoachCardProps {
  coach: CoachMeta;
  active?: boolean;
  onSelect?: () => void;
  /** Compact tile (selector) vs full card (registry). */
  compact?: boolean;
  className?: string;
}

/**
 * CoachCard — a selectable coach tile. Compact form powers the CoachSelector;
 * the full form (with outputs) powers the CoachRegistryPanel. Purely
 * presentational — selection is lifted to the parent.
 */
export function CoachCard({ coach, active, onSelect, compact, className }: CoachCardProps) {
  const Icon = coachIcon(coach.icon);
  const interactive = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!interactive}
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all',
        active ? 'border-primary/50 bg-primary/[0.07]' : 'border-border bg-card/60',
        interactive && 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow',
        !interactive && 'cursor-default',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          active ? 'bg-primary/20 text-primary' : 'bg-accent text-primary',
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{coach.title}</span>
          {active && <Check className="size-3.5 shrink-0 text-primary" />}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[11px] text-muted-foreground">{coach.description}</span>
        {!compact && coach.outputs.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1">
            {coach.outputs.map((o) => (
              <span key={o} className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
                {o}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}
