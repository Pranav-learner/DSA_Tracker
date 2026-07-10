import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowRight, Target, Flag, Route, Sparkles } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { useMentorOverview } from '@/hooks/useAI';

/**
 * MentorOSCard — the Home Dashboard's AI Operating System entry point (Sprint 4).
 * Surfaces today's mentor brief, the highest-priority recommendation, the
 * suggested workflow (continue) and a quick launcher — all deep-linking into the
 * AI OS dashboard or the workspace. The AI recommends; the learner decides.
 */
export function MentorOSCard() {
  const navigate = useNavigate();
  const { data, isLoading } = useMentorOverview();

  const brief = data?.brief;
  const topRec = data?.recommendations[0];

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Cpu className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">AI Operating System</h3>
          <p className="truncate text-xs text-muted-foreground">{brief?.periodLabel ?? 'Your mentor, coordinating everything'}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/ai/os')}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
        >
          Open <ArrowRight className="size-3.5" />
        </button>
      </div>

      {isLoading || !brief ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              <Target className="size-3" /> Today's brief
            </p>
            <p className="mt-0.5 text-sm font-medium">{brief.headline}</p>
            <p className="text-[11px] text-muted-foreground">{brief.todaysFocus}</p>
          </div>

          {topRec && (
            <button
              type="button"
              onClick={() => (topRec.action?.to ? navigate(topRec.action.to) : navigate('/ai/os'))}
              className="group flex w-full items-start gap-2.5 rounded-lg border border-border bg-card/60 p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
            >
              <Flag className="mt-0.5 size-4 shrink-0 text-warning" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Highest priority</span>
                <span className="block truncate text-xs font-semibold">{topRec.title}</span>
              </span>
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {brief.suggestedWorkflow && (
            <button
              type="button"
              onClick={() => navigate('/ai/os')}
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background/40 p-2.5 text-left transition-colors hover:border-primary/30"
            >
              <Route className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Continue workflow</span>
                <span className="truncate text-xs font-medium">{brief.suggestedWorkflow.name}</span>
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/ai')}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Sparkles className="size-3.5" /> Ask AI
          </button>
        </>
      )}
    </CardContainer>
  );
}
