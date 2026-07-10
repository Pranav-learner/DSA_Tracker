import { useNavigate } from 'react-router-dom';
import { Lightbulb, ListChecks, ChevronDown, Link2, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleExpandedSection } from '@/store/slices/aiSlice';
import { coachIcon } from '@/lib/coachIcons';
import { CardContainer } from '@/components/common/CardContainer';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { SuggestedActionPanel } from './SuggestedActionPanel';
import { ContextUsageCard } from './ContextUsageCard';
import { FollowUpQuestionList } from './FollowUpQuestionList';
import { cn } from '@/lib/utils';
import type { CoachResponse as CoachResponseData, CoachMeta } from '@/types';

interface CoachResponseProps {
  response: CoachResponseData;
  coach?: CoachMeta;
  /** Send a follow-up question back to the coach. */
  onFollowUp: (question: string) => void;
  className?: string;
}

/**
 * CoachResponse — the structured coaching card that accompanies a coach turn. The
 * narrative "explanation" streams into the chat bubble above; this card surfaces
 * the deterministic scaffolding the coach derived from the learner's data:
 * summary, recommendations, one-tap deep-link actions, related topics, confidence,
 * the context it used and follow-up questions. Reusable + collapsible.
 */
export function CoachResponse({ response, coach, onFollowUp, className }: CoachResponseProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const expanded = useAppSelector((s) => s.ai.expandedSections);
  const Icon = coachIcon(coach?.icon ?? response.coachId);

  // Recommendations + context default to expanded; toggled per response id.
  const recKey = `rec-${response.assistantMessage.id}`;
  const ctxKey = `ctx-${response.assistantMessage.id}`;
  const recOpen = expanded[recKey] ?? true;
  const ctxOpen = expanded[ctxKey] ?? false;

  return (
    <CardContainer className={cn('space-y-3.5 border-primary/20', className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{coach?.title ?? 'Coach'}</p>
          <p className="truncate text-[11px] text-muted-foreground">{response.summary}</p>
        </div>
        <ConfidenceIndicator value={response.confidence} showLabel={false} />
      </div>

      {/* Recommendations */}
      {response.recommendations.length > 0 && (
        <Section
          open={recOpen}
          onToggle={() => dispatch(toggleExpandedSection(recKey))}
          icon={<ListChecks className="size-3.5 text-primary" />}
          title="Recommendations"
        >
          <ul className="space-y-1.5">
            {response.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Suggested actions (deep links) */}
      {response.suggestedActions.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3 text-primary" /> Suggested actions
          </p>
          <SuggestedActionPanel actions={response.suggestedActions} />
        </div>
      )}

      {/* Related topics */}
      {response.relatedTopics.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Link2 className="size-3 text-primary" /> Related topics
          </p>
          <div className="flex flex-wrap gap-1.5">
            {response.relatedTopics.map((t, i) => (
              <button
                key={`${t.title}-${i}`}
                type="button"
                disabled={!t.to}
                onClick={() => t.to && navigate(t.to)}
                className={cn(
                  'rounded-full border border-border px-2.5 py-0.5 text-[11px] transition-colors',
                  t.to ? 'cursor-pointer text-foreground hover:border-primary/40 hover:text-primary' : 'cursor-default text-muted-foreground',
                )}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context used (collapsible) */}
      <Section
        open={ctxOpen}
        onToggle={() => dispatch(toggleExpandedSection(ctxKey))}
        icon={<Link2 className="size-3.5 text-primary" />}
        title={`Context used (${response.sourcesUsed.length})`}
      >
        <ContextUsageCard sourcesUsed={response.sourcesUsed} sections={response.contextSections} />
      </Section>

      {/* Follow-up questions */}
      <FollowUpQuestionList questions={response.followUpQuestions} onPick={onFollowUp} />
    </CardContainer>
  );
}

/** A collapsible titled section inside the coach response card. */
function Section({
  open,
  onToggle,
  icon,
  title,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
        aria-expanded={open}
      >
        {icon}
        {title}
        <ChevronDown className={cn('ml-auto size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-2.5 pb-2.5">{children}</div>}
    </div>
  );
}
