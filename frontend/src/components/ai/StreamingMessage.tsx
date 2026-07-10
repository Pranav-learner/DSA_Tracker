import { Bot, Square } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TypingIndicator } from './TypingIndicator';
import { cn } from '@/lib/utils';

interface StreamingMessageProps {
  content: string;
  onStop: () => void;
  className?: string;
}

/**
 * StreamingMessage — the in-flight assistant bubble. Renders the accumulated
 * tokens as live Markdown with a typing indicator, plus a Stop button to abort
 * generation. Swapped for a persisted MessageBubble once the turn completes.
 */
export function StreamingMessage({ content, onStop, className }: StreamingMessageProps) {
  return (
    <div className={cn('group flex gap-3', className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Bot className="size-4" />
      </span>
      <div className="min-w-0 max-w-[85%] space-y-2">
        <div className="inline-block rounded-2xl border border-border bg-card/60 px-4 py-2.5">
          {content ? <MarkdownRenderer content={content} /> : <TypingIndicator />}
          {content && <TypingIndicator className="mt-2" />}
        </div>
        <div className="px-1">
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Square className="size-3 fill-current" /> Stop generating
          </button>
        </div>
      </div>
    </div>
  );
}
