import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, ArrowRight, MessageSquare, Lightbulb, History } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { QuickActionPanel } from '@/components/ai';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIWorkspace } from '@/hooks/useAI';
import { useAppDispatch } from '@/store/hooks';
import { newConversation, setInput, setActiveCommand, setCurrentConversation } from '@/store/slices/aiSlice';
import { findSlashCommand, INTENT_LABEL } from '@/lib/aiCatalog';
import { relativeTime } from '@/lib/utils';
import type { AiIntent, SuggestedPrompt } from '@/types';

/**
 * AiMentorCard — the Home Dashboard's AI entry point. Surfaces one-tap ways into
 * the mentor: ask AI, today's AI recommendation, a personalised suggested
 * question, continue the last conversation and quick mentor actions. Selecting a
 * prompt prefills the workspace input (and preselects its context) before
 * navigating, so the learner lands ready to send. Self-fetches from GET
 * /ai/workspace.
 */
export function AiMentorCard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data, isLoading } = useAIWorkspace();

  /** Open a fresh mentor turn with a message + its context preselected. */
  const askWith = (text: string, command?: string | null, intent?: AiIntent) => {
    dispatch(newConversation());
    const meta = command ? findSlashCommand(command) : undefined;
    if (meta) dispatch(setActiveCommand(meta));
    else if (intent) dispatch(setActiveCommand(null));
    dispatch(setInput(text));
    navigate('/ai');
  };

  const openSuggestion = (s: SuggestedPrompt) => askWith(s.text, s.command, s.intent);

  const runCommand = (command: string) => {
    const meta = findSlashCommand(command);
    askWith(meta?.starter ?? '', command);
  };

  const continueLast = () => {
    const last = data?.recentConversations[0];
    if (!last) return;
    dispatch(setCurrentConversation(last.id));
    navigate('/ai');
  };

  const topSuggestion = data?.suggestions[0];
  const recommendation = data?.recommendation;
  const lastConversation = data?.recentConversations[0];

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Bot className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Ask your AI Mentor</h3>
          <p className="text-xs text-muted-foreground">Context-aware coaching from your live progress</p>
        </div>
        <button
          type="button"
          onClick={() => askWith('')}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform active:scale-95"
        >
          <Sparkles className="size-3.5" /> Ask AI
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {recommendation && (
            <button
              type="button"
              onClick={() => askWith(`About "${recommendation.title}" — ${recommendation.actionLabel.toLowerCase()}?`, 'study')}
              className="group flex w-full items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.06] p-3 text-left transition-colors hover:border-primary/40"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Lightbulb className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-primary">Today's AI recommendation</span>
                <span className="block truncate text-xs font-semibold">{recommendation.title}</span>
                <span className="line-clamp-2 text-[11px] text-muted-foreground">{recommendation.message}</span>
              </span>
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {topSuggestion && (
            <button
              type="button"
              onClick={() => openSuggestion(topSuggestion)}
              className="group flex w-full items-center gap-2.5 rounded-lg border border-border bg-card/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
            >
              <Sparkles className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{topSuggestion.text}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{topSuggestion.reason}</span>
              </span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {lastConversation && (
            <button
              type="button"
              onClick={continueLast}
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background/40 p-2.5 text-left transition-colors hover:border-primary/30"
            >
              <History className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Continue last conversation</span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-medium">{lastConversation.title}</span>
                </span>
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {lastConversation.lastIntent && (
                  <span className="mr-1 rounded-full bg-accent px-1.5 py-0.5 text-primary">
                    {INTENT_LABEL[lastConversation.lastIntent as AiIntent] ?? lastConversation.lastIntent}
                  </span>
                )}
                {relativeTime(lastConversation.lastMessageAt ?? lastConversation.updatedAt)}
              </span>
            </button>
          )}

          {data && data.quickActions.length > 0 && (
            <div className="space-y-1.5">
              <p className="px-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Quick mentor actions</p>
              <QuickActionPanel actions={data.quickActions} onAction={runCommand} />
            </div>
          )}
        </>
      )}
    </CardContainer>
  );
}
