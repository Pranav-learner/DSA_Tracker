import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Map as MapIcon,
  History,
  HeartPulse,
  BarChart3,
  CalendarClock,
  Brain,
  NotebookPen,
  Zap,
  ArrowRight,
  Swords,
  Trophy,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { ContestSummaryCard } from '@/components/contest';
import { CardContainer } from '@/components/common/CardContainer';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HeroCard,
  TodaysLearningCard,
  CurrentTopicCard,
  RoadmapMiniView,
  DashboardSection,
  LearningPlanCard,
  RevisionSummaryCard,
  LearningHealthCard,
  KnowledgeSummaryCard,
  ProgressOverviewCard,
  RetentionSummaryCard,
  QuickActionsPanel,
  ProgressionDashboardCard,
} from '@/components/dashboard';
import { greeting } from '@/lib/utils';

// Below-the-fold activity feed — lazily code-split.
const ActivityTimeline = lazy(() => import('@/components/dashboard/ActivityTimeline'));

/**
 * The learner's Learning Operating System — one screen that answers *what to
 * learn, what to revise, what's being forgotten, what's improving and what to
 * prioritise today*. Everything is aggregated by GET /dashboard; the page is
 * pure composition (no values are computed here).
 */
export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return null;

  const {
    overall,
    currentPhase,
    currentTopic,
    currentStage,
    recommendation,
    todayPlan,
    health,
    revision,
    retention,
    knowledge,
    quickActions,
  } = data;

  const startRevisionAction = quickActions.find((a) => a.kind === 'start-revision' && a.enabled);

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
        overallRetention={retention.averageRetention}
        secondaryTo={startRevisionAction?.to}
        secondaryLabel={startRevisionAction ? 'Start Revision' : undefined}
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 xl:grid-cols-3">
        {/* Main column */}
        <div className="space-y-8 xl:col-span-2">
          <DashboardSection
            title="Today's Plan"
            description="What to focus on right now"
            icon={<Sparkles className="size-4" />}
          >
            <div className="space-y-4">
              <LearningPlanCard plan={todayPlan} revisionTo={startRevisionAction?.to ?? '/revision'} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CurrentTopicCard
                  topic={currentTopic}
                  mastery={data.currentMastery}
                  stage={currentStage}
                  phaseTitle={currentPhase?.title}
                />
                <TodaysLearningCard recommendation={recommendation} topic={data.recommendedTopic} />
              </div>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Progression"
            description="Level, XP and learning streak"
            icon={<Trophy className="size-4" />}
            action={
              <Button variant="link" size="sm" asChild>
                <Link to="/progression">
                  View progression <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          >
            <ProgressionDashboardCard />
          </DashboardSection>

          <DashboardSection
            title="Today's Revision"
            icon={<CalendarClock className="size-4" />}
            action={
              <Button variant="link" size="sm" asChild>
                <Link to="/revision">
                  Open revision <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          >
            <RevisionSummaryCard revision={revision} />
          </DashboardSection>

          <DashboardSection title="Learning Health" icon={<HeartPulse className="size-4" />}>
            <LearningHealthCard health={health} />
          </DashboardSection>

          <DashboardSection title="Progress" icon={<BarChart3 className="size-4" />}>
            <ProgressOverviewCard
              overall={overall}
              currentPhase={currentPhase}
              currentTopic={currentTopic}
              retention={retention}
            />
          </DashboardSection>

          <DashboardSection
            title="Knowledge Retention"
            icon={<Brain className="size-4" />}
            action={
              <Button variant="link" size="sm" asChild>
                <Link to="/retention">
                  Details <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          >
            <RetentionSummaryCard retention={retention} />
          </DashboardSection>

          <DashboardSection
            title="Knowledge Summary"
            icon={<NotebookPen className="size-4" />}
            action={
              <Button variant="link" size="sm" asChild>
                <Link to="/notebook">
                  View notebook <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          >
            <KnowledgeSummaryCard knowledge={knowledge} />
          </DashboardSection>

          <DashboardSection
            title="Roadmap"
            icon={<MapIcon className="size-4" />}
            action={
              <Button variant="link" size="sm" asChild>
                <Link to="/roadmap">
                  Full roadmap <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          >
            <RoadmapMiniView phases={data.roadmap} />
          </DashboardSection>

          <DashboardSection title="Recent Activity" icon={<History className="size-4" />}>
            <CardContainer>
              <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                <ActivityTimeline activities={data.recentActivity} />
              </Suspense>
            </CardContainer>
          </DashboardSection>
        </div>

        {/* Right insight panel */}
        <aside className="space-y-8 xl:sticky xl:top-24 xl:self-start">
          <DashboardSection title="Quick Actions" icon={<Zap className="size-4" />}>
            <QuickActionsPanel actions={quickActions} />
          </DashboardSection>

          {data.contest.totalContests > 0 && (
            <DashboardSection title="Contests" icon={<Swords className="size-4" />}>
              <ContestSummaryCard contest={data.contest} />
            </DashboardSection>
          )}

          <DashboardSection title="Phase" icon={<Layers className="size-4" />}>
            <PhaseGlance data={data} />
          </DashboardSection>
        </aside>
      </div>
    </div>
  );
}

/** Compact current-phase snapshot for the insight rail. */
function PhaseGlance({ data }: { data: ReturnType<typeof useDashboard>['data'] }) {
  const progress = data?.currentPhaseProgress;
  if (!progress) {
    return (
      <CardContainer>
        <p className="text-sm text-muted-foreground">No active phase yet — start the roadmap to begin.</p>
      </CardContainer>
    );
  }
  return (
    <CardContainer className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{progress.phase.title}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{progress.completionPercent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.completionPercent}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {progress.topicsCompleted}/{progress.topicsTotal} topics
        </span>
        <span>~{progress.estimatedTimeRemainingHours}h remaining</span>
      </div>
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
          <Skeleton className="h-52 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
