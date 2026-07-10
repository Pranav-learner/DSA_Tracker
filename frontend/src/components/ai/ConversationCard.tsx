import { MessageSquare, Trash2 } from 'lucide-react';
import { relativeTime, cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationCardProps {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

/** A single conversation row in the sidebar (title, recency, delete on hover). */
export function ConversationCard({ conversation, active, onSelect, onDelete }: ConversationCardProps) {
  return (
    <div
      className={cn(
        'group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
      onClick={onSelect}
      role="button"
    >
      <MessageSquare className="size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{conversation.title}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {conversation.messageCount} messages · {conversation.lastMessageAt ? relativeTime(conversation.lastMessageAt) : relativeTime(conversation.createdAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-danger/15 hover:text-danger group-hover:opacity-100"
        aria-label="Delete conversation"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
