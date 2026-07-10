import { Check, Database } from 'lucide-react';
import { coachIcon } from '@/lib/coachIcons';
import { PROFILE_META } from '@/lib/aiCatalog';
import { CardContainer } from '@/components/common/CardContainer';
import { cn } from '@/lib/utils';
import type { CoachMeta } from '@/types';

interface CoachCapabilityCardProps {
  coach: CoachMeta;
  className?: string;
}

/**
 * CoachCapabilityCard — a detailed capabilities view for one coach: what it
 * produces (outputs) and which context profiles it draws on. Used in the coach
 * registry / detail so learners understand what each specialist offers.
 */
export function CoachCapabilityCard({ coach, className }: CoachCapabilityCardProps) {
  const Icon = coachIcon(coach.icon);
  return (
    <CardContainer className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">{coach.title}</h4>
          <p className="text-[11px] text-muted-foreground">{coach.description}</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Produces</p>
        <ul className="space-y-1">
          {coach.outputs.map((o) => (
            <li key={o} className="flex items-center gap-1.5 text-xs">
              <Check className="size-3.5 shrink-0 text-success" />
              {o}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Database className="size-3" /> Draws on
        </p>
        <div className="flex flex-wrap gap-1.5">
          {coach.usesProfiles.map((p) => (
            <span key={p} className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-[11px] text-muted-foreground" title={PROFILE_META[p]?.description}>
              {PROFILE_META[p]?.label ?? p}
            </span>
          ))}
        </div>
      </div>
    </CardContainer>
  );
}
