import { MessagesSquare, Pin, Archive } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setConversationFilter, type ConversationFilter as Filter } from '@/store/slices/aiSlice';
import { cn } from '@/lib/utils';

const OPTIONS: { value: Filter; label: string; icon: typeof Pin }[] = [
  { value: 'all', label: 'All', icon: MessagesSquare },
  { value: 'pinned', label: 'Pinned', icon: Pin },
  { value: 'archived', label: 'Archived', icon: Archive },
];

/**
 * ConversationFilter — a segmented control switching the sidebar between all,
 * pinned and archived conversations. Selection lives in Redux; the sidebar reads
 * it to scope the list (and to include archived threads from the server).
 */
export function ConversationFilter({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.ai.conversationFilter);

  return (
    <div className={cn('flex items-center gap-0.5 rounded-lg border border-border bg-background/40 p-0.5', className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => dispatch(setConversationFilter(value))}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
            active === value ? 'bg-accent text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={active === value}
        >
          <Icon className="size-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
