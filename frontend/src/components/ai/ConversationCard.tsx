import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Trash2, Pin, PinOff, Pencil, Archive, ArchiveRestore, Download, MoreHorizontal, Check, X } from 'lucide-react';
import { relativeTime, cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationCardProps {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onRename: (title: string) => void;
  onExport: () => void;
  /** Optional matched snippet to show under the title (search results). */
  snippet?: string;
}

/**
 * ConversationCard — a conversation row in the sidebar. Shows the title, pinned
 * state and recency, plus hover actions: pin/unpin, an overflow menu (rename,
 * archive, export) and delete. Rename is inline. All mutations are lifted to the
 * sidebar; this card is purely presentational + local edit state.
 */
export function ConversationCard({
  conversation,
  active,
  onSelect,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onRename,
  onExport,
  snippet,
}: ConversationCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startRename = () => {
    setDraft(conversation.title);
    setEditing(true);
    setMenuOpen(false);
  };
  const commitRename = () => {
    const next = draft.trim();
    if (next && next !== conversation.title) onRename(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-card px-2 py-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          aria-label="Conversation title"
        />
        <button type="button" onClick={commitRename} className="rounded p-0.5 text-success hover:bg-accent" aria-label="Save">
          <Check className="size-3.5" />
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded p-0.5 text-muted-foreground hover:bg-accent" aria-label="Cancel">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
      onClick={onSelect}
      role="button"
    >
      {conversation.pinned ? (
        <Pin className="size-3.5 shrink-0 text-primary" />
      ) : (
        <MessageSquare className="size-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{conversation.title}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {snippet ?? (
            <>
              {conversation.messageCount} messages ·{' '}
              {relativeTime(conversation.lastMessageAt ?? conversation.createdAt)}
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="rounded p-1 text-muted-foreground hover:bg-primary/15 hover:text-primary"
          aria-label={conversation.pinned ? 'Unpin' : 'Pin'}
          title={conversation.pinned ? 'Unpin' : 'Pin'}
        >
          {conversation.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="More actions"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-glow"
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem icon={<Pencil className="size-3.5" />} onClick={startRename}>
                Rename
              </MenuItem>
              <MenuItem
                icon={conversation.archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                onClick={() => {
                  onToggleArchive();
                  setMenuOpen(false);
                }}
              >
                {conversation.archived ? 'Unarchive' : 'Archive'}
              </MenuItem>
              <MenuItem
                icon={<Download className="size-3.5" />}
                onClick={() => {
                  onExport();
                  setMenuOpen(false);
                }}
              >
                Export
              </MenuItem>
              <MenuItem
                icon={<Trash2 className="size-3.5" />}
                danger
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
              >
                Delete
              </MenuItem>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent',
        danger ? 'text-danger hover:bg-danger/10' : 'text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
