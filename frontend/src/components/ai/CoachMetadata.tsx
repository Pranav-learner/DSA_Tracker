import { Tag, Sparkles } from 'lucide-react';
import { coachIcon } from '@/lib/coachIcons';
import { INTENT_LABEL } from '@/lib/aiCatalog';
import { cn } from '@/lib/utils';
import type { CoachMeta } from '@/types';

interface CoachMetadataProps {
  coach: CoachMeta;
  className?: string;
}

/**
 * CoachMetadata — the compact identity header for the active coach: icon, title,
 * description, prompt version and the intents it serves. Shown at the top of coach
 * mode so the learner always knows which specialist they're talking to.
 */
export function CoachMetadata({ coach, className }: CoachMetadataProps) {
  const Icon = coachIcon(coach.icon);
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border border-border bg-card/60 p-3', className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{coach.title}</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground" title="Prompt template version">
            <Tag className="size-2.5" /> {coach.promptVersion}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{coach.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Sparkles className="size-3 text-primary/70" />
          {coach.supportedIntents.slice(0, 4).map((i) => (
            <span key={i} className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {INTENT_LABEL[i] ?? i}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
