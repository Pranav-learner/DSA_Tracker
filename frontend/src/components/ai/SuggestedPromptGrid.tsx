import { Sparkles, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SuggestedPrompt } from '@/types';

interface SuggestedPromptGridProps {
  suggestions?: SuggestedPrompt[];
  isLoading?: boolean;
  /** Fired with the prompt when a suggestion is tapped (message + its command). */
  onPick: (suggestion: SuggestedPrompt) => void;
  className?: string;
  columns?: 1 | 2;
}

/**
 * SuggestedPromptGrid — personalised, one-tap prompts generated from the
 * learner's current progress. Each carries the intent + slash command it maps to,
 * so picking one both fills the message and preselects the right context profile.
 */
export function SuggestedPromptGrid({
  suggestions,
  isLoading,
  onPick,
  className,
  columns = 2,
}: SuggestedPromptGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-2', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!suggestions?.length) {
    return (
      <p className={cn('flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground', className)}>
        <Lightbulb className="size-3.5" /> Keep learning — personalised prompts appear as your progress grows.
      </p>
    );
  }

  return (
    <div className={cn('grid gap-2', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1', className)}>
      {suggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s)}
          className="group flex flex-col gap-1 rounded-lg border border-border bg-card/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-3.5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">{s.text}</span>
          </span>
          <span className="pl-[1.375rem] text-[11px] text-muted-foreground">{s.reason}</span>
        </button>
      ))}
    </div>
  );
}
