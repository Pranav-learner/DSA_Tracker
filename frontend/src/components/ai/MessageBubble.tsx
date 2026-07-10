import { Bot, User } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageToolbar } from './MessageToolbar';
import { ContextBadge } from './ContextBadge';
import { TokenUsageCard } from './TokenUsageCard';
import { ResponseTimeBadge } from './ResponseTimeBadge';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  /** Show a regenerate action (assistant + last message only). */
  onRegenerate?: () => void;
  /** Show a continue action (assistant + last message only). */
  onContinue?: () => void;
  className?: string;
}

/**
 * MessageBubble — a single chat turn. User turns render as plain text on an
 * accent surface; assistant turns render Markdown with a telemetry footer
 * (context badge, provider/model, tokens, response time) and copy/regenerate
 * actions. The atomic unit of the conversation window.
 */
export function MessageBubble({ message, onRegenerate, onContinue, className }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('group flex gap-3', isUser && 'flex-row-reverse', className)}>
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          isUser ? 'bg-accent text-foreground' : 'bg-primary/15 text-primary',
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </span>

      <div className={cn('min-w-0 max-w-[85%] space-y-2', isUser && 'items-end text-right')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2.5 text-left',
            isUser ? 'bg-accent text-foreground' : 'border border-border bg-card/60',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {!isUser && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            {message.context && <ContextBadge intent={message.context.intent} sections={message.context.sections} />}
            {message.provider && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {message.provider}
                {message.model ? ` · ${message.model}` : ''}
              </span>
            )}
            <TokenUsageCard usage={message.usage} />
            <ResponseTimeBadge ms={message.responseTime} />
            <MessageToolbar
              content={message.content}
              onRegenerate={onRegenerate}
              onContinue={onContinue}
              className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}
