import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Eye, ListTree, Lightbulb, GraduationCap, StickyNote, Network, Trash2 } from 'lucide-react';
import { useNotebookEntry, useUpdateNotebook, useDeleteNotebook } from '@/hooks/useNotebook';
import { useRetentionProfile } from '@/hooks/useRetention';
import { KnowledgeHealthCard } from '@/components/retention';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CardContainer } from '@/components/common/CardContainer';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  NotebookHeader,
  NotebookEditor,
  ComplexityCard,
  ConfidenceSlider,
  ObservationCard,
  LessonCard,
  RelatedProblemCard,
  KnowledgeLinkCard,
  RevisionHistoryCard,
  KeywordChip,
} from '@/components/notebook';
import type { UpdateNotebookInput } from '@/types';

export function NotebookWorkspacePage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const { data: entry, isLoading, isError, error, refetch } = useNotebookEntry(notebookId);
  const retentionQuery = useRetentionProfile(notebookId);
  const updateMutation = useUpdateNotebook();
  const deleteMutation = useDeleteNotebook();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const onSave = useCallback(
    (patch: UpdateNotebookInput) => {
      if (entry) updateMutation.mutate({ id: entry.id, patch });
    },
    [entry, updateMutation],
  );

  const saveStatus = updateMutation.isPending
    ? 'Saving…'
    : updateMutation.isSuccess
      ? 'All changes saved'
      : '';

  const markReviewed = () => entry && updateMutation.mutate({ id: entry.id, patch: { review: true } });

  const handleDelete = () => {
    if (!entry) return;
    if (!window.confirm(`Delete the notebook entry for "${entry.title}"? This can't be undone.`)) return;
    deleteMutation.mutate(entry.id, { onSuccess: () => navigate('/notebook') });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Pattern Notebook', to: '/notebook' }, { label: entry?.title ?? 'Entry' }]} />

      {isLoading && <WorkspaceSkeleton />}
      {isError && <ErrorState error={error} onRetry={refetch} />}

      {entry && (
        <>
          <NotebookHeader
            entry={entry}
            editing={editing}
            onToggleEdit={() => setEditing((v) => !v)}
            saveStatus={saveStatus}
          />

          {editing ? (
            <NotebookEditor entry={entry} onSave={onSave} />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {/* Main column */}
              <div className="space-y-4 xl:col-span-2">
                {entry.recognitionKeywords.length > 0 && (
                  <CardContainer className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Hash className="size-4" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Recognition Keywords
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.recognitionKeywords.map((kw) => (
                        <KeywordChip key={kw} label={kw} />
                      ))}
                    </div>
                  </CardContainer>
                )}

                <ObservationCard title="Observation" icon={<Eye className="size-4" />} content={entry.observation} />
                <ObservationCard title="Core Algorithm" icon={<ListTree className="size-4" />} content={entry.coreAlgorithm} />
                <ComplexityCard timeComplexity={entry.timeComplexity} spaceComplexity={entry.spaceComplexity} />

                {entry.alternativeSolutions.length > 0 && (
                  <CardContainer className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <ListTree className="size-4" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Alternative Solutions
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {entry.alternativeSolutions.map((alt, i) => (
                        <li key={i} className="rounded-lg border border-border bg-accent/20 p-3">
                          <p className="text-sm font-semibold">{alt.title}</p>
                          {alt.detail && <p className="mt-0.5 text-sm text-muted-foreground">{alt.detail}</p>}
                        </li>
                      ))}
                    </ul>
                  </CardContainer>
                )}

                <LessonCard title="Common Mistakes" icon={<Lightbulb className="size-4" />} items={entry.commonMistakes} />
                <ObservationCard title="Lessons Learned" icon={<GraduationCap className="size-4" />} content={entry.lessonsLearned} />
                {entry.personalNotes.trim() && (
                  <ObservationCard title="Personal Notes" icon={<StickyNote className="size-4" />} content={entry.personalNotes} />
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Network className="size-4" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Related Problems
                    </h3>
                  </div>
                  {entry.relatedProblems.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {entry.relatedProblems.map((p, i) => (
                        <RelatedProblemCard key={p.id} problem={p} index={i} />
                      ))}
                    </div>
                  ) : (
                    <CardContainer className="text-sm italic text-muted-foreground">
                      No related problems linked yet.
                    </CardContainer>
                  )}
                </div>
              </div>

              {/* Right column */}
              <aside className="space-y-4">
                {retentionQuery.data && <KnowledgeHealthCard profile={retentionQuery.data} />}
                <CardContainer>
                  <ConfidenceSlider value={entry.confidence} readOnly />
                </CardContainer>
                <KnowledgeLinkCard entries={entry.relatedEntries} />
                <RevisionHistoryCard
                  revisionDates={entry.revisionDates}
                  lastReviewedAt={entry.lastReviewedAt}
                  onMarkReviewed={markReviewed}
                  isReviewing={updateMutation.isPending}
                />
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-danger hover:text-danger">
                  <Trash2 className="size-4" /> Delete entry
                </Button>
              </aside>
            </div>
          )}
        </>
      )}

      {!isLoading && !isError && !entry && (
        <EmptyState title="Notebook entry not found" description="It may have been deleted." />
      )}
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
