import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setConversationSearch } from '@/store/slices/aiSlice';
import { cn } from '@/lib/utils';

/**
 * ConversationSearch — a debounced search box for the conversation sidebar. Local
 * state keeps typing snappy; the committed query lands in Redux (debounced) where
 * the sidebar reads it to switch between the full list and server search results.
 */
export function ConversationSearch({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const committed = useAppSelector((s) => s.ai.conversationSearch);
  const [value, setValue] = useState(committed);

  // Debounce commits to Redux (which triggers the server search query).
  useEffect(() => {
    const t = setTimeout(() => dispatch(setConversationSearch(value.trim())), 250);
    return () => clearTimeout(t);
  }, [value, dispatch]);

  // Keep local state in sync when cleared elsewhere.
  useEffect(() => {
    if (!committed && value) setValue('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committed]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search conversations…"
        className="w-full rounded-lg border border-border bg-background/60 py-1.5 pl-8 pr-8 text-xs outline-none transition-colors focus:border-primary/40 [&::-webkit-search-cancel-button]:hidden"
        aria-label="Search conversations"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
