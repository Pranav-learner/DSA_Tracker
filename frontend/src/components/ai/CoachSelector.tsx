import { Bot } from 'lucide-react';
import { useCoaches } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCoach, useMentorChat } from '@/store/slices/aiSlice';
import { coachIcon } from '@/lib/coachIcons';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CoachSelectorProps {
  className?: string;
  /** 'chips' = horizontal scroll row (header); 'grid' = 2-col tiles (rail). */
  layout?: 'chips' | 'grid';
}

/**
 * CoachSelector — switch between the generic Mentor (chat) and a specialized
 * coach. Selecting a coach flips the workspace into coach mode so the next turn
 * goes through that coach's structured pipeline; "Mentor" returns to open chat.
 * Reads the registry from React Query; selection lives in Redux.
 */
export function CoachSelector({ className, layout = 'chips' }: CoachSelectorProps) {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.ai.conversationMode);
  const selectedCoachId = useAppSelector((s) => s.ai.selectedCoachId);
  const { data, isLoading } = useCoaches();

  if (isLoading) {
    return (
      <div className={cn(layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex gap-2', className)}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-lg" />)}
      </div>
    );
  }

  const coaches = data?.coaches ?? [];
  const isMentor = mode === 'chat';

  const wrap = layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  return (
    <div className={cn(wrap, className)} role="tablist" aria-label="Coach selector">
      <Chip active={isMentor} icon={<Bot className="size-3.5" />} label="Mentor" onClick={() => dispatch(useMentorChat())} layout={layout} />
      {coaches.map((c) => {
        const Icon = coachIcon(c.icon);
        const active = mode === 'coach' && selectedCoachId === c.id;
        return (
          <Chip
            key={c.id}
            active={active}
            icon={<Icon className="size-3.5" />}
            label={c.title.replace(' Coach', '')}
            title={c.description}
            onClick={() => dispatch(selectCoach(c.id))}
            layout={layout}
          />
        );
      })}
    </div>
  );
}

function Chip({
  active,
  icon,
  label,
  onClick,
  title,
  layout,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  title?: string;
  layout: 'chips' | 'grid';
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
        layout === 'grid' && 'w-full justify-start',
        active
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground',
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
