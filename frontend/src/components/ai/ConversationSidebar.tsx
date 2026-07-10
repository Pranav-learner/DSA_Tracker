import { Plus, MessageSquare } from 'lucide-react';
import { useConversations, useDeleteConversation } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { newConversation, setCurrentConversation } from '@/store/slices/aiSlice';
import { ConversationCard } from './ConversationCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * ConversationSidebar — the thread list with a "New chat" action. Reads the
 * conversation list from React Query and the active thread from Redux; selecting
 * or deleting a thread updates both. Collapsible via the workspace layout.
 */
export function ConversationSidebar({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const currentId = useAppSelector((s) => s.ai.currentConversationId);
  const { data: conversations, isLoading } = useConversations();
  const del = useDeleteConversation();

  return (
    <div className={cn('flex h-full flex-col border-r border-border bg-surface/60', className)}>
      <div className="p-3">
        <button
          type="button"
          onClick={() => dispatch(newConversation())}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Plus className="size-4" /> New chat
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)
        ) : conversations && conversations.length > 0 ? (
          conversations.map((c) => (
            <ConversationCard
              key={c.id}
              conversation={c}
              active={c.id === currentId}
              onSelect={() => dispatch(setCurrentConversation(c.id))}
              onDelete={() => {
                del.mutate(c.id);
                if (c.id === currentId) dispatch(newConversation());
              }}
            />
          ))
        ) : (
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title="No conversations"
            description="Start a new chat to talk with your mentor."
            className="border-0 bg-transparent py-10"
          />
        )}
      </div>
    </div>
  );
}
