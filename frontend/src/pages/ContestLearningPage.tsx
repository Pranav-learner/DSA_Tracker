import { useParams, Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Plus, ListPlus, Loader2 } from 'lucide-react';
import { useContestLearning, useGenerateUpsolve } from '@/hooks/useContestLearning';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setReflectionEditing } from '@/store/slices/contestSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { AnalyticsSection } from '@/components/analytics';
import { ContestSkeleton } from '@/components/contest';
import {
  ContestLearningSummary,
  ContestReflectionCard,
  PostmortemEditor,
  PatternGapCard,
  AlgorithmGapCard,
  LearningGoalCard,
  KnowledgeIntegrationCard,
  UpsolveQueue,
} from '@/components/contest/learning';

/** Contest Learning — the primary post-contest screen (reflection + upsolve + gaps). */
export function ContestLearningPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const editing = useAppSelector((s) => s.contest.reflectionEditing);
  const { data, isLoading, isError, error, refetch } = useContestLearning(id);
  const generate = useGenerateUpsolve(id ?? '');

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/contests/${id}/workspace`}><ArrowLeft className="size-4" /> Workspace</Link>
      </Button>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data || !id ? (
        <ContestSkeleton variant="grid" rows={6} />
      ) : (
        <>
          <SectionHeader eyebrow="Contest Learning" title="Reflect & Upsolve" description="Turn this contest into learning — the beginning, not the end." icon={<GraduationCap className="size-5" />} />

          <ContestLearningSummary learning={data} />

          <AnalyticsSection title="Reflection">
            {editing ? (
              <PostmortemEditor contestId={id} postmortem={data.postmortem} onDone={() => dispatch(setReflectionEditing(false))} />
            ) : data.postmortem ? (
              <ContestReflectionCard postmortem={data.postmortem} onEdit={() => dispatch(setReflectionEditing(true))} />
            ) : (
              <CardContainer className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">No reflection yet — capture what went well, what went wrong and your next focus.</span>
                <Button size="sm" onClick={() => dispatch(setReflectionEditing(true))}><Plus className="size-4" /> Write reflection</Button>
              </CardContainer>
            )}
          </AnalyticsSection>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <AnalyticsSection
                title="Upsolve Queue"
                action={
                  <Button size="sm" variant="secondary" disabled={generate.isPending} onClick={() => generate.mutate()}>
                    {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <ListPlus className="size-4" />} Generate
                  </Button>
                }
              >
                <UpsolveQueue tasks={data.upsolve} contestId={id} emptyDescription="Generate tasks from the contest's unsolved problems." />
              </AnalyticsSection>
              <PatternGapCard analysis={data.patternAnalysis} />
            </div>

            <div className="space-y-6">
              <LearningGoalCard goals={data.postmortem?.learningGoals ?? []} suggested={data.suggestedLearningGoals} />
              <AlgorithmGapCard gaps={data.algorithmGaps} />
              <KnowledgeIntegrationCard tasks={data.upsolve} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
