import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, History, MessageSquare } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoaches, useAIWorkspace } from '@/hooks/useAI';
import { useAppDispatch } from '@/store/hooks';
import { selectCoach, setInput, setCurrentConversation, newConversation } from '@/store/slices/aiSlice';
import { coachIcon } from '@/lib/coachIcons';
import { relativeTime } from '@/lib/utils';

/** Which coaches to surface on the dashboard, in order. */
const FEATURED = ['study', 'contest', 'interview', 'revision'];

/**
 * CoachEntryCard — the Home Dashboard's coaching entry points (Module 7 · Sprint
 * 3). Surfaces one-tap ways into the specialized coaches (Study, Contest,
 * Interview, Revision) and a "continue last coaching session" shortcut. Selecting
 * a coach preselects it and prefills a starter question before navigating, so the
 * learner lands in coach mode ready to send.
 */
export function CoachEntryCard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: coachesData, isLoading } = useCoaches();
  const { data: workspace } = useAIWorkspace();

  const coaches = coachesData?.coaches ?? [];
  const featured = FEATURED.map((id) => coaches.find((c) => c.id === id)).filter(Boolean) as NonNullable<
    (typeof coaches)[number]
  >[];
  const lastConversation = workspace?.recentConversations[0];

  const askCoach = (coachId: string, starter: string) => {
    dispatch(newConversation());
    dispatch(selectCoach(coachId));
    dispatch(setInput(starter));
    navigate('/ai');
  };

  const continueLast = () => {
    if (!lastConversation) return;
    dispatch(setCurrentConversation(lastConversation.id));
    navigate('/ai');
  };

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Users className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Specialized Coaches</h3>
          <p className="text-xs text-muted-foreground">Domain coaching from your live progress</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/ai')}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
        >
          All coaches <ArrowRight className="size-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {featured.map((c) => {
            const Icon = coachIcon(c.icon);
            const starter = c.followUps[0] ?? `Help me with ${c.title.toLowerCase()}.`;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => askCoach(c.id, starter)}
                className="group flex items-start gap-2.5 rounded-lg border border-border bg-card/60 p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{c.title.replace(' Coach', '')}</span>
                  <span className="line-clamp-2 block text-[11px] text-muted-foreground">{starter}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {lastConversation && (
        <button
          type="button"
          onClick={continueLast}
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background/40 p-2.5 text-left transition-colors hover:border-primary/30"
        >
          <History className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Continue last session</span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs font-medium">{lastConversation.title}</span>
            </span>
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {relativeTime(lastConversation.lastMessageAt ?? lastConversation.updatedAt)}
          </span>
        </button>
      )}
    </CardContainer>
  );
}
