import { useParams } from 'react-router-dom';
import {
  Lightbulb,
  Tags,
  ListOrdered,
  BookMarked,
  Code2,
  Sparkles,
  Trophy,
  RefreshCw,
  BarChart3,
  Bot,
  Lock,
} from 'lucide-react';
import { useTopic, useTopicRelated, useTopicProblems } from '@/hooks/useTopic';
import { useTopicMastery, useTopicProgress, useRecommendation } from '@/hooks/useLearning';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { WorkspaceSection } from '@/components/common/WorkspaceSection';
import { CardContainer } from '@/components/common/CardContainer';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TopicHeader } from '@/components/topic/TopicHeader';
import { ConceptCard } from '@/components/topic/ConceptCard';
import { KeywordChip } from '@/components/topic/KeywordChip';
import { PatternLadder } from '@/components/topic/PatternLadder';
import { PatternCard, type PatternCardData } from '@/components/topic/PatternCard';
import { MetadataPanel } from '@/components/topic/MetadataPanel';
import { EstimatedTimeCard } from '@/components/topic/EstimatedTimeCard';
import { LearningResourceCard } from '@/components/topic/LearningResourceCard';
import { RepresentativeProblemTable } from '@/components/topic/RepresentativeProblemTable';
import { AssessmentCard } from '@/components/topic/AssessmentCard';
import { NotebookCard } from '@/components/topic/NotebookCard';
import { TopicNavigation } from '@/components/topic/TopicNavigation';
import { MasteryRing } from '@/components/learning/MasteryRing';
import { StageProgress } from '@/components/learning/StageProgress';
import { CompletionBadge } from '@/components/learning/CompletionBadge';
import { UnlockBadge } from '@/components/learning/UnlockBadge';
import { LearningRecommendationCard } from '@/components/learning/LearningRecommendationCard';
import { LEARNING_RESOURCES } from '@/lib/learningResources';
import { STAGE_LABELS } from '@/lib/mastery';

const FUTURE_MODULES = [
  { title: 'Mastery Tracking', description: 'Live mastery score from solves & retention.', icon: Trophy },
  { title: 'Spaced Revision', description: 'Smart review scheduling to fight forgetting.', icon: RefreshCw },
  { title: 'Analytics', description: 'Insights into strengths, gaps and pace.', icon: BarChart3 },
  { title: 'AI Mentor', description: 'On-demand hints and guided problem solving.', icon: Bot },
];

export function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const topicQuery = useTopic(topicId);
  const relatedQuery = useTopicRelated(topicId);
  const problemsQuery = useTopicProblems(topicId);
  const masteryQuery = useTopicMastery(topicId);
  const progressQuery = useTopicProgress(topicId);
  const recommendationQuery = useRecommendation();

  const crumbs = [
    { label: 'Roadmap', to: '/roadmap' },
    ...(topicQuery.data
      ? [{ label: `Phase ${topicQuery.data.phase.order}`, to: `/roadmap/${topicQuery.data.phaseId}` }]
      : []),
    { label: topicQuery.data?.title ?? 'Topic' },
  ];

  if (topicQuery.isError) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={crumbs} />
        <ErrorState error={topicQuery.error} onRetry={topicQuery.refetch} />
      </div>
    );
  }

  if (topicQuery.isLoading || !topicQuery.data) {
    return <WorkspaceSkeleton crumbs={crumbs} />;
  }

  const topic = topicQuery.data;

  const patternData: PatternCardData = {
    name: `${topic.title} Pattern`,
    coreIdea: topic.concept.coreIdea,
    recognitionDifficulty: topic.difficulty,
    implementationDifficulty: topic.difficulty,
    relatedTopics: relatedQuery.data?.related.map((t) => t.title) ?? [],
    estimatedLearningHours: topic.estimatedHours,
  };

  const mastery = masteryQuery.data;
  const topicProgress = progressQuery.data;

  return (
    <div className="space-y-8">
      <Breadcrumb items={crumbs} />
      <TopicHeader topic={topic} status={mastery?.status} currentStage={topicProgress?.currentStage} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-10 lg:col-span-2">
          <WorkspaceSection title="Concept Overview" icon={<Lightbulb className="size-5" />}>
            <ConceptCard concept={topic.concept} />
          </WorkspaceSection>

          <WorkspaceSection
            title="Recognition Keywords"
            icon={<Tags className="size-5" />}
            description="Signals in a problem statement that hint this pattern applies."
          >
            {topic.recognitionKeywords.length > 0 ? (
              <CardContainer>
                <div className="flex flex-wrap gap-2">
                  {topic.recognitionKeywords.map((kw) => (
                    <KeywordChip key={kw} label={kw} />
                  ))}
                </div>
              </CardContainer>
            ) : (
              <EmptyState title="No keywords yet" />
            )}
          </WorkspaceSection>

          <WorkspaceSection
            title="Pattern Ladder"
            icon={<ListOrdered className="size-5" />}
            description="Progress from recognising the pattern to solving contest-grade problems."
          >
            <div className="grid grid-cols-1 gap-4">
              <PatternCard pattern={patternData} />
              <PatternLadder ladder={mastery?.ladder} />
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            title="Learning Resources"
            icon={<BookMarked className="size-5" />}
            description="Study material for this topic (markdown-ready, populated in a later sprint)."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {LEARNING_RESOURCES.map((resource) => (
                <LearningResourceCard key={resource.key} resource={resource} />
              ))}
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            title="Representative Problems"
            icon={<Code2 className="size-5" />}
            description="Curated, read-only problems. Full tracking arrives with the Problem Tracker."
          >
            <RepresentativeProblemTable
              topicId={topic.id}
              problems={problemsQuery.data}
              isLoading={problemsQuery.isLoading}
            />
          </WorkspaceSection>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AssessmentCard />
            <NotebookCard />
          </div>

          <WorkspaceSection
            title="Future Modules"
            icon={<Sparkles className="size-5" />}
            description="What this workspace grows into across the next sprints."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FUTURE_MODULES.map((m) => {
                const Ico = m.icon;
                return (
                  <CardContainer key={m.title} className="flex items-start gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-accent text-primary">
                      <Ico className="size-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">{m.title}</h3>
                        <Badge variant="outline">
                          <Lock className="size-3" /> Soon
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                    </div>
                  </CardContainer>
                );
              })}
            </div>
          </WorkspaceSection>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Live mastery & ladder progress (Sprint 3) */}
          {mastery && (
            <CardContainer className="space-y-5">
              <div className="flex items-center gap-4">
                <MasteryRing value={mastery.overallMastery} size={88} />
                <div className="space-y-1.5">
                  <CompletionBadge status={mastery.status} />
                  {topicProgress && <UnlockBadge unlocked={topicProgress.unlocked} />}
                  <p className="text-xs text-muted-foreground">
                    Stage:{' '}
                    <span className="text-foreground">
                      {STAGE_LABELS[topicProgress?.currentStage ?? 'recognition']}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ladder Progress
                </p>
                <StageProgress ladder={mastery.ladder} />
              </div>
            </CardContainer>
          )}

          {recommendationQuery.data && (
            <LearningRecommendationCard recommendation={recommendationQuery.data} />
          )}

          <MetadataPanel
            topic={topic}
            relations={relatedQuery.data}
            relationsLoading={relatedQuery.isLoading}
          />
          <EstimatedTimeCard
            hours={topic.estimatedHours}
            hint={`${topic.estimatedProblems} problems to practice`}
          />
        </aside>
      </div>

      <TopicNavigation navigation={topic.navigation} phaseId={topic.phaseId} />
    </div>
  );
}

function WorkspaceSkeleton({ crumbs }: { crumbs: { label: string; to?: string }[] }) {
  return (
    <div className="space-y-8">
      <Breadcrumb items={crumbs} />
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}
