import { useMemo, useState } from 'react';
import { Plus, MessageSquare, SearchX } from 'lucide-react';
import {
  useConversations,
  useConversationSearch,
  useDeleteConversation,
  useUpdateConversation,
} from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { newConversation, setCurrentConversation } from '@/store/slices/aiSlice';
import { ConversationCard } from './ConversationCard';
import { ConversationSearch } from './ConversationSearch';
import { ConversationFilter } from './ConversationFilter';
import { PinnedConversationList, type ConversationHandlers } from './PinnedConversationList';
import { ConversationExportDialog } from './ConversationExportDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

/**
 * ConversationSidebar — the full conversation manager: new-chat action, debounced
 * search, all/pinned/archived filter, a pinned group and the thread list. Each
 * card supports pin/rename/archive/export/delete. Reads lists from React Query and
 * the active thread from Redux; mutations invalidate the cache. Collapsible via
 * the workspace layout.
 */
export function ConversationSidebar({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const currentId = useAppSelector((s) => s.ai.currentConversationId);
  const search = useAppSelector((s) => s.ai.conversationSearch);
  const filter = useAppSelector((s) => s.ai.conversationFilter);
  const searching = search.trim().length >= 2;

  const { data: conversations, isLoading } = useConversations(filter === 'archived');
  const { data: searchResults, isFetching: searchFetching } = useConversationSearch(search);
  const del = useDeleteConversation();
  const update = useUpdateConversation();

  const [exportTarget, setExportTarget] = useState<Conversation | null>(null);

  const handlers: ConversationHandlers = {
    onSelect: (c) => dispatch(setCurrentConversation(c.id)),
    onDelete: (c) => {
      del.mutate(c.id);
      if (c.id === currentId) dispatch(newConversation());
    },
    onTogglePin: (c) => update.mutate({ id: c.id, patch: { pinned: !c.pinned } }),
    onToggleArchive: (c) => update.mutate({ id: c.id, patch: { archived: !c.archived } }),
    onRename: (c, title) => update.mutate({ id: c.id, patch: { title } }),
    onExport: (c) => setExportTarget(c),
  };

  // Scope the list to the active filter (search overrides the filter entirely).
  const { pinned, rest } = useMemo(() => {
    const all = conversations ?? [];
    const visible =
      filter === 'pinned' ? all.filter((c) => c.pinned && !c.archived)
      : filter === 'archived' ? all.filter((c) => c.archived)
      : all.filter((c) => !c.archived);
    return {
      pinned: filter === 'all' ? visible.filter((c) => c.pinned) : [],
      rest: filter === 'all' ? visible.filter((c) => !c.pinned) : visible,
    };
  }, [conversations, filter]);

  return (
    <div className={cn('flex h-full flex-col border-r border-border bg-surface/60', className)}>
      <div className="space-y-2.5 p-3">
        <button
          type="button"
          onClick={() => dispatch(newConversation())}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Plus className="size-4" /> New chat
        </button>
        <ConversationSearch />
        {!searching && <ConversationFilter />}
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {searching ? (
          searchFetching && !searchResults ? (
            <ListSkeleton />
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((c) => (
              <ConversationCard
                key={c.id}
                conversation={c}
                active={c.id === currentId}
                onSelect={() => handlers.onSelect(c)}
                onDelete={() => handlers.onDelete(c)}
                onTogglePin={() => handlers.onTogglePin(c)}
                onToggleArchive={() => handlers.onToggleArchive(c)}
                onRename={(title) => handlers.onRename(c, title)}
                onExport={() => handlers.onExport(c)}
              />
            ))
          ) : (
            <EmptyState
              icon={<SearchX className="size-5" />}
              title="No matches"
              description={`Nothing found for “${search.trim()}”.`}
              className="border-0 bg-transparent py-10"
            />
          )
        ) : isLoading ? (
          <ListSkeleton />
        ) : pinned.length + rest.length > 0 ? (
          <>
            <PinnedConversationList conversations={pinned} activeId={currentId} handlers={handlers} />
            {pinned.length > 0 && rest.length > 0 && (
              <p className="px-2 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Recent</p>
            )}
            {rest.map((c) => (
              <ConversationCard
                key={c.id}
                conversation={c}
                active={c.id === currentId}
                onSelect={() => handlers.onSelect(c)}
                onDelete={() => handlers.onDelete(c)}
                onTogglePin={() => handlers.onTogglePin(c)}
                onToggleArchive={() => handlers.onToggleArchive(c)}
                onRename={(title) => handlers.onRename(c, title)}
                onExport={() => handlers.onExport(c)}
              />
            ))}
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title={filter === 'archived' ? 'No archived chats' : filter === 'pinned' ? 'No pinned chats' : 'No conversations'}
            description={filter === 'all' ? 'Start a new chat to talk with your mentor.' : 'Nothing here yet.'}
            className="border-0 bg-transparent py-10"
          />
        )}
      </div>

      <ConversationExportDialog conversation={exportTarget} open={Boolean(exportTarget)} onClose={() => setExportTarget(null)} />
    </div>
  );
}

function ListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </>
  );
}
