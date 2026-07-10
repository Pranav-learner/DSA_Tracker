import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Lightbulb, Activity, Newspaper, History, Zap, Search, MessageSquare } from 'lucide-react';
import { useMentorOverview, useConversations, useGenerateWorkflow, useTimeline } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedWorkflow, setTimelineFilter, type TimelineFilter } from '@/store/slices/aiSlice';
import { MentorOverview } from './MentorOverview';
import { MentorBriefCard } from './MentorBriefCard';
import { WorkflowCard } from './WorkflowCard';
import { WorkflowPreviewModal } from './WorkflowPreviewModal';
import { RecommendationTimeline } from './RecommendationTimeline';
import { MentorInsightCard } from './MentorInsightCard';
import { ConversationSummaryCard } from './ConversationSummaryCard';
import { ActionButtonGrid } from './ActionButtonGrid';
import { DashboardSection } from '@/components/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Workflow, WorkflowKey, TimelineEntryType } from '@/types';

const TIMELINE_FILTERS: { value: TimelineFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'recommendation', label: 'Recs' },
  { value: 'coaching-session', label: 'Sessions' },
  { value: 'workflow', label: 'Workflows' },
  { value: 'milestone', label: 'Milestones' },
];

/**
 * AIOperatingDashboard — the AI Operating System dashboard (Module 7 · Sprint 4).
 * Composes the mentor overview, today's brief, recommended workflows, the
 * recommendation center, the searchable AI timeline, recent coaching sessions and
 * quick actions. Everything the AI surfaces is a suggestion; the learner drives
 * every action.
 */
export function AIOperatingDashboard({ className }: { className?: string }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: overview, isLoading } = useMentorOverview();
  const { data: conversations } = useConversations();
  const generate = useGenerateWorkflow();

  const selectedWorkflow = useAppSelector((s) => s.ai.selectedWorkflow);
  const timelineFilter = useAppSelector((s) => s.ai.timelineFilter);
  const [search, setSearch] = useState('');

  const types = timelineFilter === 'all' ? undefined : ([timelineFilter] as TimelineEntryType[]);
  const { data: timeline, isFetching: timelineLoading } = useTimeline({ q: search || undefined, types, limit: 40 });

  const workflows = overview?.workflows ?? [];
  const previewWorkflow: Workflow | null = useMemo(
    () => workflows.find((w) => w.key === selectedWorkflow) ?? null,
    [workflows, selectedWorkflow],
  );

  /** Persist the workflow, then jump to its first actionable step. */
  const startWorkflow = async (key: WorkflowKey) => {
    const saved = await generate.mutateAsync({ key, save: true });
    dispatch(setSelectedWorkflow(null));
    const firstStep = saved.steps.find((s) => s.action?.to);
    if (firstStep?.action?.to) navigate(firstStep.action.to);
  };

  const recentSessions = (conversations ?? []).filter((c) => c.messageCount > 0).slice(0, 3);

  return (
    <div className={cn('space-y-6', className)}>
      <MentorOverview />

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 xl:grid-cols-3">
        {/* Main column */}
        <div className="space-y-8 xl:col-span-2">
          <DashboardSection title="Today's Mentor Brief" icon={<Newspaper className="size-4" />}>
            <MentorBriefCard onStartWorkflow={startWorkflow} />
          </DashboardSection>

          <DashboardSection title="Recommended Workflows" description="Structured plans — you drive each step" icon={<Route className="size-4" />}>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {workflows.map((w) => (
                  <WorkflowCard
                    key={w.key}
                    workflow={w}
                    starting={generate.isPending}
                    onPreview={() => dispatch(setSelectedWorkflow(w.key))}
                    onStart={() => startWorkflow(w.key)}
                  />
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection title="AI Timeline" description="Your searchable coaching history" icon={<Activity className="size-4" />}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search the timeline…"
                    className="w-full rounded-lg border border-border bg-background/60 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary/40"
                  />
                </div>
                <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background/40 p-0.5">
                  {TIMELINE_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => dispatch(setTimelineFilter(f.value))}
                      className={cn(
                        'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                        timelineFilter === f.value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {timelineLoading && !timeline ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : timeline && timeline.length > 0 ? (
                <div className="space-y-2">{timeline.map((e) => <MentorInsightCard key={e.id} entry={e} />)}</div>
              ) : (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  Nothing here yet — coaching activity will appear on your timeline.
                </p>
              )}
            </div>
          </DashboardSection>
        </div>

        {/* Right rail */}
        <aside className="space-y-8">
          <DashboardSection title="Recommendation Center" icon={<Lightbulb className="size-4" />}>
            <RecommendationTimeline />
          </DashboardSection>

          <DashboardSection title="Quick AI Actions" icon={<Zap className="size-4" />}>
            {overview && overview.actions.length > 0 ? (
              <ActionButtonGrid actions={overview.actions} columns={1} />
            ) : (
              <Skeleton className="h-24 w-full rounded-lg" />
            )}
          </DashboardSection>

          <DashboardSection
            title="Recent Coaching Sessions"
            icon={<History className="size-4" />}
            action={
              <Button variant="link" size="sm" onClick={() => navigate('/ai')}>
                Open workspace
              </Button>
            }
          >
            {recentSessions.length ? (
              <div className="space-y-2">
                {recentSessions.map((c) => <ConversationSummaryCard key={c.id} conversation={c} />)}
              </div>
            ) : (
              <p className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                <MessageSquare className="size-4" /> No coaching sessions yet.
              </p>
            )}
          </DashboardSection>
        </aside>
      </div>

      <WorkflowPreviewModal
        workflow={previewWorkflow}
        open={Boolean(previewWorkflow)}
        onClose={() => dispatch(setSelectedWorkflow(null))}
        onStart={() => previewWorkflow && startWorkflow(previewWorkflow.key)}
        starting={generate.isPending}
      />
    </div>
  );
}
