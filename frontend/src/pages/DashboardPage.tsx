import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Map as MapIcon,
  History,
  Lightbulb,
  ClipboardList,
  Gauge,
  HeartHandshake,
  Flag,
  CircleDashed,
  CheckCircle2,
  Flame,
  ArrowRight,
  Lock,
  BarChart3,
  CalendarClock,
  Brain,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useRetentionOverview } from '@/hooks/useRetention';
import { DueTodayWidget } from '@/components/revision';
import { RetentionOverviewCard } from '@/components/retention';
import { CardContainer } from '@/components/common/CardContainer';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LearningRecommendationCard } from '@/components/learning/LearningRecommendationCard';
import {
  HeroCard,
  TodaysLearningCard,
  CurrentTopicCard,
  ProgressSummaryCard,
  PhaseProgressCard,
  RoadmapMiniView,
  LearningInsightCard,
  DashboardSection,
} from '@/components/dashboard';
import { STAGE_LABELS, masteryTone } from '@/lib/mastery';
import { greeting } from '@/lib/utils';

// Non-critical below-the-fold section — lazily code-split.
const ActivityTimeline = lazy(() => import('@/components/dashboard/ActivityTimeline'));

/**
 * The learner's home screen — a personal-mentor dashboard aggregating current
 * state, next action, progress, roadmap position and recent activity from the
 * single GET /dashboard endpoint.
 */
export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const { data: retentionOverview } = useRetentionOverview();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return null;

  const { overall, currentPhase, currentTopic, currentStage, recommendation } = data;

  return (
    <div className="space-y-6">
      <HeroCard
        greeting={greeting()}
        phase={currentPhase}
        topic={currentTopic}
        stage={currentStage}
        overallMastery={overall.overallMastery}
        completionPercent={overall.completionPercent}
        topicsRemaining={overall.topicsRemaining}
        continueTo={recommendation.actionTo}
        continueLabel={currentTopic ? 'Continue Learning' : recommendation.actionLabel}
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 xl:grid-cols-3">
        {/* Main column */}
        <div className="space-y-8 xl:col-span-2">
          <DashboardSection
            title="Today's Learning"
            description="What to focus on right now"
            icon={<Sparkles className="size-4" />}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CurrentTopicCard
                topic={currentTopic}
                mastery={data.currentMastery}
                stage={currentStage}
                phaseTitle={currentPhase?.title}
              />
              <TodaysLearningCard recommendation={recommendation} topic={data.recommendedTopic} />
            </div>
          </DashboardSection>

          <DashboardSection title="Learning Progress" icon={<BarChart3 className="size-4" />}>
            <ProgressSummaryCard overall={overall} />
          </DashboardSection>

          <DashboardSection title="Current Phase" icon={<Layers className="size-4" />}>
            <PhaseProgressCard phase={data.currentPhaseProgress} />
          </DashboardSection>

          {retentionOverview && retentionOverview.totalProfiles > 0 && (
            <DashboardSection title="Knowledge Retention" icon={<Brain className="size-4" />}>
              <RetentionOverviewCard overview={retentionOverview} />
            </DashboardSection>
          )}

          <DashboardSection
            title="Roadmap"
            icon={<MapIcon className="size-4" />}
            action={
              <Button variant="link" size="sm" asChild>
                <Link to="/roadmap">
                  View full roadmap <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          >
            <RoadmapMiniView phases={data.roadmap} />
          </DashboardSection>

          <DashboardSection title="Recent Learning Activity" icon={<History className="size-4" />}>
            <CardContainer>
              <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                <ActivityTimeline activities={data.recentActivity} />
              </Suspense>
            </CardContainer>
          </DashboardSection>
        </div>

        {/* Right insights panel */}
        <aside className="space-y-8">
          <DashboardSection title="Revision" icon={<CalendarClock className="size-4" />}>
            <DueTodayWidget revision={data.revision} />
          </DashboardSection>

          <DashboardSection title="Learning Insights" icon={<Lightbulb className="size-4" />}>
            <div className="space-y-3">
              <LearningRecommendationCard recommendation={recommendation} />
              <LearningInsightCard
                icon={<Gauge className="size-4" />}
                label="Current Mastery"
                value={`${data.currentMastery}%`}
                tone={masteryTone(data.currentMastery)}
              />
              <LearningInsightCard
                icon={<HeartHandshake className="size-4" />}
                label="Current Confidence"
                value={`${overall.averageConfidence}%`}
                tone={masteryTone(overall.averageConfidence)}
              />
              <LearningInsightCard
                icon={<Flag className="size-4" />}
                label="Current Learning Stage"
                value={currentStage ? STAGE_LABELS[currentStage] : 'Not started'}
                tone="primary"
              />
              <LearningInsightCard
                icon={<CircleDashed className="size-4" />}
                label="Topics Remaining"
                value={overall.topicsRemaining}
                hint={`of ${overall.topicsTotal}`}
              />
            </div>
          </DashboardSection>

          <DashboardSection title="Learning Summary" icon={<ClipboardList className="size-4" />}>
            <div className="space-y-3">
              <LearningInsightCard
                icon={<CheckCircle2 className="size-4" />}
                label="Topics Completed"
                value={`${overall.topicsCompleted}/${overall.topicsTotal}`}
                tone="success"
              />
              <LearningInsightCard
                icon={<Layers className="size-4" />}
                label="Phases Completed"
                value={`${overall.phasesCompleted}/${overall.phasesTotal}`}
              />
              <LearningInsightCard
                icon={<Flame className="size-4" />}
                label="Learning Streak"
                value="Coming soon"
                hint="soon"
              />
              <UpcomingFeatures />
            </div>
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
}

const UPCOMING = ['Problem Tracker', 'Revision Scheduler', 'Analytics', 'Contests'];

/** Placeholder card teasing future modules (kept out of scope this sprint). */
function UpcomingFeatures() {
  return (
    <CardContainer className="space-y-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Upcoming Features
      </p>
      <ul className="space-y-1.5">
        {UPCOMING.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground/70">
            <Lock className="size-3.5 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

/** Full-page loading skeleton mirroring the dashboard layout. */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-52 w-full rounded-lg" />
            <Skeleton className="h-52 w-full rounded-lg" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
