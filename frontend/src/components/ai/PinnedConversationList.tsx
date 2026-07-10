import { Pin } from 'lucide-react';
import { ConversationCard } from './ConversationCard';
import type { Conversation } from '@/types';

/** Per-conversation action handlers shared by the sidebar lists. */
export interface ConversationHandlers {
  onSelect: (c: Conversation) => void;
  onDelete: (c: Conversation) => void;
  onTogglePin: (c: Conversation) => void;
  onToggleArchive: (c: Conversation) => void;
  onRename: (c: Conversation, title: string) => void;
  onExport: (c: Conversation) => void;
}

interface PinnedConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  handlers: ConversationHandlers;
}

/**
 * PinnedConversationList — the "Pinned" group at the top of the sidebar. Renders
 * nothing when no conversation is pinned; otherwise a small labelled section of
 * ConversationCards, wired to the same action handlers as the main list.
 */
export function PinnedConversationList({ conversations, activeId, handlers }: PinnedConversationListProps) {
  if (!conversations.length) return null;

  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1 px-2 pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Pin className="size-2.5" /> Pinned
      </p>
      {conversations.map((c) => (
        <ConversationCard
          key={c.id}
          conversation={c}
          active={c.id === activeId}
          onSelect={() => handlers.onSelect(c)}
          onDelete={() => handlers.onDelete(c)}
          onTogglePin={() => handlers.onTogglePin(c)}
          onToggleArchive={() => handlers.onToggleArchive(c)}
          onRename={(title) => handlers.onRename(c, title)}
          onExport={() => handlers.onExport(c)}
        />
      ))}
    </div>
  );
}
