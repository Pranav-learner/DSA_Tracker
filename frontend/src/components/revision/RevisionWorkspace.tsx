import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ListTree, Lightbulb, Cpu, GraduationCap, ListChecks, Network, AlertCircle } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ComplexityCard, ConfidenceSlider } from '@/components/notebook';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setWorkspaceMode,
  startTimer,
  pauseTimer,
  resetTimer,
} from '@/store/slices/revisionSlice';
import { useStartSession, useCompleteSession, useUpdateSession } from '@/hooks/useRevisionSession';
import { RevisionHeader } from './RevisionHeader';
import { RevisionTimer } from './RevisionTimer';
import { RevisionSessionControls } from './RevisionSessionControls';
import { RecognitionKeywordPanel } from './RecognitionKeywordPanel';
import { KnowledgeSummaryCard } from './KnowledgeSummaryCard';
import { MistakeReviewCard } from './MistakeReviewCard';
import { ContestTrapCard } from './ContestTrapCard';
import { RepresentativeProblemCard } from './RepresentativeProblemCard';
import { RevisionPanel } from './RevisionPanel';
import { QuickReviewCard } from './QuickReviewCard';
import { RevisionSummaryModal } from './RevisionSummaryModal';
import type { RevisionSession, RevisionWorkspace as RevisionWorkspaceData } from '@/types';

/**
 * The Revision Workspace — a distraction-free study environment. Reuses Module 2
 * knowledge content (no duplicate storage) and drives the session lifecycle
 * (start / pause / resume / complete / abandon) with a Redux-backed timer.
 */
export function RevisionWorkspace({ workspace }: { workspace: RevisionWorkspaceData }) {
  const { content, activeSession, schedule } = workspace;
  const dispatch = useAppDispatch();
  const { workspaceMode, timerRunning, elapsedSeconds } = useAppSelector((s) => s.revision);

  const startMutation = useStartSession();
  const completeMutation = useCompleteSession();
  const updateMutation = useUpdateSession();

  // The active session only "belongs" to this workspace if it's the same entity.
  const session = activeSession && activeSession.entityId === content.entityId ? activeSession : null;
  const otherActive = activeSession && activeSession.entityId !== content.entityId ? activeSession : null;

  const [notes, setNotes] = useState(session?.reviewNotes ?? '');
  const [confidence, setConfidence] = useState(content.confidence ?? 50);
  const [summary, setSummary] = useState<RevisionSession | null>(null);

  useEffect(() => {
    setNotes(session?.reviewNotes ?? '');
  }, [session?.id]);

  const busy = startMutation.isPending || completeMutation.isPending || updateMutation.isPending;

  const handleStart = () =>
    startMutation.mutate(
      {
        scheduleId: schedule?.id,
        entityType: content.entityType,
        entityId: content.entityId,
        selfConfidenceBefore: content.confidence ?? undefined,
      },
      {
        onSuccess: () => {
          dispatch(resetTimer());
          dispatch(startTimer());
        },
      },
    );

  const handlePause = () => {
    dispatch(pauseTimer());
    if (session) updateMutation.mutate({ id: session.id, patch: { action: 'pause' } });
  };
  const handleResume = () => {
    dispatch(startTimer());
    if (session) updateMutation.mutate({ id: session.id, patch: { action: 'resume' } });
  };
  const handleComplete = () => {
    if (!session) return;
    completeMutation.mutate(
      {
        sessionId: session.id,
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
        reviewNotes: notes,
        selfConfidenceAfter: confidence,
      },
      {
        onSuccess: (s) => {
          dispatch(resetTimer());
          setSummary(s);
        },
      },
    );
  };
  const handleAbandon = () => {
    if (!session) return;
    if (!window.confirm('Abandon this revision session? Your notes are kept.')) return;
    updateMutation.mutate(
      { id: session.id, patch: { action: 'abandon', reviewNotes: notes } },
      { onSuccess: () => dispatch(resetTimer()) },
    );
  };
  const saveNotes = () => {
    if (session && notes !== session.reviewNotes) updateMutation.mutate({ id: session.id, patch: { reviewNotes: notes } });
  };

  return (
    <div className="space-y-6">
      <RevisionHeader
        content={content}
        schedule={schedule}
        session={session}
        mode={workspaceMode}
        onModeChange={(m) => dispatch(setWorkspaceMode(m))}
      />

      {otherActive && (
        <CardContainer className="flex items-center gap-2 border-warning/40 bg-warning/[0.06] text-sm text-warning">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">
            You have an active session on <span className="font-medium">{otherActive.title}</span>.
          </span>
          <Link to="/revision" className="font-medium underline">
            Finish it
          </Link>
        </CardContainer>
      )}

      {/* Session control bar */}
      <CardContainer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RevisionTimer />
        <RevisionSessionControls
          active={Boolean(session)}
          running={timerRunning}
          busy={busy}
          blocked={Boolean(otherActive)}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onComplete={handleComplete}
          onAbandon={handleAbandon}
        />
      </CardContainer>

      {workspaceMode === 'quick' ? (
        <QuickReviewCard content={content} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Knowledge (reused from Module 2) */}
          <div className="space-y-4 xl:col-span-2">
            <RecognitionKeywordPanel keywords={content.recognitionKeywords} />
            <KnowledgeSummaryCard title="Core Idea" icon={<Eye className="size-4" />} content={content.coreIdea} panelKey="coreIdea" />
            {content.coreAlgorithm.trim() && (
              <KnowledgeSummaryCard title="Core Algorithm" icon={<ListTree className="size-4" />} content={content.coreAlgorithm} panelKey="coreAlgorithm" />
            )}
            {(content.whenToUse || content.whenNotToUse) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <KnowledgeSummaryCard title="When To Use" icon={<ListChecks className="size-4" />} content={content.whenToUse} panelKey="whenToUse" />
                <KnowledgeSummaryCard title="When Not To Use" icon={<AlertCircle className="size-4" />} content={content.whenNotToUse} panelKey="whenNotToUse" />
              </div>
            )}
            {(content.timeComplexity || content.spaceComplexity) && (
              <ComplexityCard timeComplexity={content.timeComplexity} spaceComplexity={content.spaceComplexity} />
            )}
            <MistakeReviewCard mistakes={content.commonMistakes} />
            <ContestTrapCard traps={content.contestTraps} />

            {content.representativeProblems.length > 0 && (
              <RevisionPanel title="Representative Problems" icon={<ListChecks className="size-4" />} panelKey="repProblems">
                <div className="space-y-2">
                  {content.representativeProblems.map((p) => (
                    <RepresentativeProblemCard key={p.id} problem={p} />
                  ))}
                </div>
              </RevisionPanel>
            )}

            {content.alternativeSolutions.length > 0 && (
              <RevisionPanel title="Alternative Approaches" icon={<ListTree className="size-4" />} panelKey="alternatives">
                <ul className="space-y-2">
                  {content.alternativeSolutions.map((a, i) => (
                    <li key={i} className="rounded-lg border border-border bg-accent/20 p-3">
                      <p className="text-sm font-semibold">{a.title}</p>
                      {a.detail && <p className="mt-0.5 text-sm text-muted-foreground">{a.detail}</p>}
                    </li>
                  ))}
                </ul>
              </RevisionPanel>
            )}

            {content.relatedProblems.length > 0 && (
              <RevisionPanel title="Related Problems" icon={<Network className="size-4" />} panelKey="relatedProblems">
                <div className="space-y-2">
                  {content.relatedProblems.map((p) => (
                    <RepresentativeProblemCard key={p.id} problem={p} />
                  ))}
                </div>
              </RevisionPanel>
            )}

            {content.knowledgeNotes.trim() && (
              <KnowledgeSummaryCard title="Knowledge Notes" icon={<GraduationCap className="size-4" />} content={content.knowledgeNotes} panelKey="knowledgeNotes" />
            )}
          </div>

          {/* Session sidebar: quick notes + confidence */}
          <aside className="space-y-4">
            <CardContainer className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Lightbulb className="size-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Notes</h3>
              </div>
              <textarea
                rows={5}
                value={notes}
                disabled={!session}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder={session ? 'Jot anything worth remembering…' : 'Start the review to take notes.'}
                className="w-full resize-y rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
              />
            </CardContainer>

            <CardContainer className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Cpu className="size-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Confidence</h3>
              </div>
              <ConfidenceSlider value={confidence} onChange={setConfidence} label="How confident now?" />
              <p className="text-[11px] text-muted-foreground">Stored with the session — no scoring is applied yet.</p>
            </CardContainer>
          </aside>
        </div>
      )}

      <RevisionSummaryModal open={Boolean(summary)} onClose={() => setSummary(null)} session={summary} />
    </div>
  );
}
