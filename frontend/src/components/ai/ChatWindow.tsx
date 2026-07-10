import { useEffect, useRef } from 'react';
import { Bot, Settings2, PanelLeft, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';
import { useConversation, useChatStream } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setInput, setSettingsOpen, toggleSidebar } from '@/store/slices/aiSlice';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { ChatInput } from './ChatInput';
import { ContextBadge } from './ContextBadge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChatMessage } from '@/types';

const SUGGESTIONS = [
  'What should I learn next?',
  'Explain the sliding window pattern',
  'How do I improve my contest rating?',
  'What should I revise today?',
];

/**
 * ChatWindow — the conversation surface: header (title + context badge +
 * settings), the message list (persisted turns + the live streaming turn), and
 * the input. Auto-scrolls as content arrives. When no conversation is selected it
 * shows a welcome with suggested prompts.
 */
export function ChatWindow() {
  const dispatch = useAppDispatch();
  const { currentConversationId, input, isStreaming, streamingContent, pendingUserMessage, activeContext, streamError } =
    useAppSelector((s) => s.ai);
  const { data: conversation, isLoading } = useConversation(currentConversationId);
  const { send, stop } = useChatStream();

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length, streamingContent, pendingUserMessage]);

  const messages = conversation?.messages.filter((m) => m.role !== 'system') ?? [];
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const showWelcome = !currentConversationId && !isStreaming && !pendingUserMessage && messages.length === 0;

  const handleSend = () => {
    const text = input.trim();
    if (text) send(text);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button type="button" onClick={() => dispatch(toggleSidebar())} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden" aria-label="Toggle sidebar">
          <PanelLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{conversation?.title ?? 'New conversation'}</h1>
        </div>
        {activeContext && <ContextBadge intent={activeContext.intent} sections={activeContext.sections} />}
        <button type="button" onClick={() => dispatch(setSettingsOpen(true))} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="AI settings">
          <Settings2 className="size-4" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
          {showWelcome ? (
            <Welcome onPick={(q) => { dispatch(setInput(q)); send(q); }} />
          ) : (
            <>
              {isLoading && currentConversationId && !pendingUserMessage ? (
                <Skeleton className="h-24 w-full rounded-lg" />
              ) : (
                messages.map((m: ChatMessage, i) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    onRegenerate={
                      !isStreaming && m.role === 'assistant' && i === messages.length - 1 && lastUserMessage
                        ? () => send(lastUserMessage.content)
                        : undefined
                    }
                  />
                ))
              )}

              {/* Optimistic in-flight turn */}
              {pendingUserMessage && (
                <MessageBubble
                  message={{
                    id: 'pending-user',
                    role: 'user',
                    content: pendingUserMessage,
                    provider: null,
                    model: null,
                    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                    responseTime: 0,
                    context: null,
                    createdAt: new Date().toISOString(),
                  }}
                />
              )}
              {isStreaming && <StreamingMessage content={streamingContent} onStop={stop} />}

              {streamError && (
                <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/[0.06] p-3 text-sm text-danger">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span className="flex-1">{streamError}</span>
                  {pendingUserMessage && (
                    <button type="button" onClick={() => send(pendingUserMessage)} className="inline-flex items-center gap-1 rounded-md border border-danger/30 px-2 py-1 text-xs hover:bg-danger/10">
                      <RotateCcw className="size-3" /> Retry
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput value={input} onChange={(v) => dispatch(setInput(v))} onSend={handleSend} disabled={isStreaming} />
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            The mentor uses a live snapshot of your progress. Responses may be imperfect.
          </p>
        </div>
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Bot className="size-7" />
      </span>
      <h2 className="text-lg font-semibold">Your CP-OS Mentor</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Ask about what to learn next, a DSA pattern, your contests or revision — the mentor sees your live progress.
      </p>
      <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
          >
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span>{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
