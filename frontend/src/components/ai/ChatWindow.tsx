import { useEffect, useRef } from 'react';
import { Bot, Settings2, PanelLeft, PanelRight, AlertTriangle, RotateCcw, X } from 'lucide-react';
import { useConversation, useMentor, useAISuggestions, useCoaches } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setInput, setSettingsOpen, toggleSidebar, toggleRightRail, setActiveCommand } from '@/store/slices/aiSlice';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { ChatInput } from './ChatInput';
import { ContextBadge } from './ContextBadge';
import { SuggestedPromptGrid } from './SuggestedPromptGrid';
import { SlashCommandMenu } from './SlashCommandMenu';
import { CoachResponse } from './CoachResponse';
import { CoachMetadata } from './CoachMetadata';
import { coachIcon } from '@/lib/coachIcons';
import { Skeleton } from '@/components/ui/skeleton';
import { parseSlashCommand, findSlashCommand, INTENT_LABEL } from '@/lib/aiCatalog';
import type { ChatMessage, SuggestedPrompt, CoachMeta } from '@/types';

/**
 * ChatWindow — the conversation surface: header (title + context badge + rail /
 * settings toggles), the message list (persisted turns + the live streaming
 * turn), and the input with slash-command support. Auto-scrolls as content
 * arrives. When no conversation is selected it shows a personalised welcome with
 * suggested prompts. Slash commands (`/study`, `/contest`, …) preselect the
 * matching context profile before sending.
 */
export function ChatWindow() {
  const dispatch = useAppDispatch();
  const { currentConversationId, input, isStreaming, streamingContent, pendingUserMessage, activeContext, streamError, activeCommand } =
    useAppSelector((s) => s.ai);
  const conversationMode = useAppSelector((s) => s.ai.conversationMode);
  const selectedCoachId = useAppSelector((s) => s.ai.selectedCoachId);
  const lastCoachResponse = useAppSelector((s) => s.ai.lastCoachResponse);
  const { data: conversation, isLoading } = useConversation(currentConversationId);
  const { data: suggestions, isLoading: suggestionsLoading } = useAISuggestions();
  const { data: coachesData } = useCoaches();
  const { send, stop } = useMentor();

  const coachMode = conversationMode === 'coach';
  const coaches = coachesData?.coaches ?? [];
  const activeCoach: CoachMeta | undefined =
    coaches.find((c) => c.id === selectedCoachId) ?? coaches.find((c) => c.id === lastCoachResponse?.coachId);
  const responseCoach = coaches.find((c) => c.id === lastCoachResponse?.coachId) ?? activeCoach;

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length, streamingContent, pendingUserMessage]);

  const messages = conversation?.messages.filter((m) => m.role !== 'system') ?? [];
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const showWelcome = !currentConversationId && !isStreaming && !pendingUserMessage && messages.length === 0;

  /** Send the input, honouring an inline slash command (`/study …`). */
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const { command, rest } = parseSlashCommand(text);
    if (command) {
      dispatch(setActiveCommand(command));
      send(rest || command.starter, { intent: command.intent, profiles: command.profiles });
    } else {
      send(text);
    }
  };

  /** Pick a personalised suggestion — preselect its command's context, then send. */
  const pickSuggestion = (s: SuggestedPrompt) => {
    const meta = s.command ? findSlashCommand(s.command) : undefined;
    if (meta) dispatch(setActiveCommand(meta));
    send(s.text, { intent: s.intent, profiles: meta?.profiles });
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
        {/* Conversation intent indicator — the active coach (coach mode). */}
        {coachMode && activeCoach && <CoachChip coach={activeCoach} />}
        {activeCommand && (
          <button
            type="button"
            onClick={() => dispatch(setActiveCommand(null))}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
            title="Active context — click to clear"
          >
            {activeCommand.label}
            <X className="size-3" />
          </button>
        )}
        {activeContext && <ContextBadge intent={activeContext.intent} sections={activeContext.sections} />}
        <button type="button" onClick={() => dispatch(toggleRightRail())} className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground xl:block" aria-label="Toggle context panel">
          <PanelRight className="size-4" />
        </button>
        <button type="button" onClick={() => dispatch(setSettingsOpen(true))} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="AI settings">
          <Settings2 className="size-4" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
          {showWelcome ? (
            <Welcome
              suggestions={suggestions}
              loading={suggestionsLoading}
              onPick={pickSuggestion}
              coach={coachMode ? activeCoach : undefined}
              onAsk={(q) => send(q)}
            />
          ) : (
            <>
              {isLoading && currentConversationId && !pendingUserMessage ? (
                <Skeleton className="h-24 w-full rounded-lg" />
              ) : (
                messages.map((m: ChatMessage) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    onRegenerate={
                      !isStreaming && m.role === 'assistant' && m.id === lastAssistant?.id && lastUserMessage
                        ? () => send(lastUserMessage.content)
                        : undefined
                    }
                    onContinue={
                      !isStreaming && m.role === 'assistant' && m.id === lastAssistant?.id
                        ? () => send('Please continue your previous response from where it stopped.')
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

              {/* Structured coach card (coach mode, after the streamed explanation). */}
              {coachMode && lastCoachResponse && !isStreaming && (
                <CoachResponse response={lastCoachResponse} coach={responseCoach} onFollowUp={(q) => send(q)} />
              )}

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
        <div className="relative mx-auto w-full max-w-3xl">
          {/^\/[a-z]*$/i.test(input) && (
            <SlashCommandMenu
              query={input.slice(1)}
              onSelect={(cmd) => {
                dispatch(setActiveCommand(cmd));
                dispatch(setInput(`/${cmd.command} `));
              }}
              className="absolute bottom-full left-0 z-30 mb-2 w-full max-w-md"
            />
          )}
          <ChatInput
            value={input}
            onChange={(v) => dispatch(setInput(v))}
            onSend={handleSend}
            disabled={isStreaming}
            placeholder="Ask your mentor anything… (type / for commands)"
          />
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {activeCommand ? (
              <>Context: <span className="text-primary">{INTENT_LABEL[activeCommand.intent]}</span> · the mentor uses a live snapshot of your progress.</>
            ) : (
              <>The mentor uses a live snapshot of your progress. Responses may be imperfect.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Welcome({
  suggestions,
  loading,
  onPick,
  coach,
  onAsk,
}: {
  suggestions?: SuggestedPrompt[];
  loading: boolean;
  onPick: (s: SuggestedPrompt) => void;
  coach?: CoachMeta;
  onAsk: (question: string) => void;
}) {
  // Coach mode: introduce the specialist and offer its seed questions.
  if (coach) {
    const Icon = coachIcon(coach.icon);
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Icon className="size-7" />
        </span>
        <h2 className="text-lg font-semibold">{coach.title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{coach.description}</p>
        <CoachMetadata coach={coach} className="mt-5 w-full max-w-md text-left" />
        <div className="mt-4 grid w-full max-w-md grid-cols-1 gap-2">
          {coach.followUps.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onAsk(q)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
            >
              <Icon className="size-4 shrink-0 text-primary" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Bot className="size-7" />
      </span>
      <h2 className="text-lg font-semibold">Your CP-OS Mentor</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Ask about what to learn next, a DSA pattern, your contests or revision — the mentor sees your live progress.
        These prompts are picked from where you are right now.
      </p>
      <SuggestedPromptGrid suggestions={suggestions} isLoading={loading} onPick={onPick} className="mt-6 w-full max-w-lg" />
    </div>
  );
}

/** The active-coach indicator chip shown in the chat header (coach mode). */
function CoachChip({ coach }: { coach: CoachMeta }) {
  const Icon = coachIcon(coach.icon);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
      title={`${coach.title} · ${coach.description}`}
    >
      <Icon className="size-3" />
      {coach.title.replace(' Coach', '')}
    </span>
  );
}
