import { FileText, Sparkles, Tag, Loader2 } from 'lucide-react';
import { useSummarizeConversation } from '@/hooks/useAI';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationSummaryCardProps {
  conversation: Conversation;
  className?: string;
}

/**
 * ConversationSummaryCard — conversation-continuity surface (Sprint 4). Shows the
 * compressed summary + tags for a coaching session, and lets the learner
 * (re)generate the summary on demand. Keeps mentor memory scoped to learning.
 */
export function ConversationSummaryCard({ conversation, className }: ConversationSummaryCardProps) {
  const summarize = useSummarizeConversation();
  const c = conversation;

  return (
    <div className={cn('rounded-lg border border-border bg-card/60 p-3', className)}>
      <div className="flex items-center gap-2">
        <FileText className="size-3.5 text-primary" />
        <p className="truncate text-xs font-semibold">{c.title}</p>
        <button
          type="button"
          onClick={() => summarize.mutate(c.id)}
          disabled={summarize.isPending || c.messageCount === 0}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          {summarize.isPending ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
          {c.summary ? 'Refresh' : 'Summarize'}
        </button>
      </div>

      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {c.summary ?? 'No summary yet — generate one to compress this session.'}
      </p>

      {c.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Tag className="size-3 text-muted-foreground" />
          {c.tags.map((t) => (
            <span key={t} className="rounded-full border border-border bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
