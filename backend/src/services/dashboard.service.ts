import { progressService } from './progress.service.js';
import { recommendationService } from './recommendation.service.js';
import { phaseService } from './phase.service.js';
import { activityService } from './activity.service.js';
import { revisionQueueService } from './revisionQueue.service.js';
import { revisionSessionService } from './revisionSession.service.js';
import { retentionService } from './retention.service.js';
import { notebookService } from './notebook.service.js';
import { dashboardInsightsService } from './dashboardInsights.service.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { toTopicSummaryDTO, type PhaseDTO, type PhaseRefDTO, type TopicSummaryDTO } from './mappers.js';
import type { PhaseProgressDTO, ProgressDTO } from './learning.dto.js';
import type {
  DashboardDTO,
  DashboardPhaseProgressDTO,
  RoadmapPhaseState,
  RoadmapSummaryPhaseDTO,
} from './dashboard.dto.js';

const RECENT_ACTIVITY_LIMIT = 8;

/**
 * DashboardService — the learner's home-screen aggregator.
 *
 * Pure ORCHESTRATION: it holds no business rules. It calls the heavy
 * `progressService.getOverview()` exactly once and derives everything else from
 * that single snapshot — recommendation (pure `build`), current phase/topic
 * refs, the compact roadmap and the recent-activity feed — mirroring how
 * `learningState.service` composes without re-querying.
 */
export const dashboardService = {
  async get(userId: string): Promise<DashboardDTO> {
    const overview = await progressService.getOverview(userId);
    const recommendation = recommendationService.build(overview);

    // Everything below reuses `overview`; only display metadata is fetched, in parallel.
    const [phases, hoursByPhase, recentActivity, revisionQueue, revisionSession, retention, knowledgeStats] =
      await Promise.all([
        phaseService.list(),
        topicRepository.estimatedHoursByPhase(),
        activityService.getRecent(userId, RECENT_ACTIVITY_LIMIT),
        revisionQueueService.getDashboardSummary(userId),
        revisionSessionService.getDashboardSummary(userId),
        retentionService.getDashboardSummary(userId),
        notebookService.stats(userId),
      ]);
    const revision = { ...revisionQueue, ...revisionSession };

    // Resolve the current + recommended topic docs in a single query (they may overlap).
    const topicIds = unique([overview.currentTopicId, recommendation.topicId]);
    const topicDocs = await topicRepository.findByIds(topicIds);
    const summaryById = new Map<string, TopicSummaryDTO>(
      topicDocs.map((t) => [String(t._id), toTopicSummaryDTO(t)]),
    );

    const phasesById = new Map(phases.map((p) => [p.id, p]));
    const phaseProgressById = new Map(overview.phases.map((p) => [p.phaseId, p]));

    const currentPhase = overview.currentPhaseId
      ? (toPhaseRef(phasesById.get(overview.currentPhaseId)) ?? null)
      : null;
    const currentTopic = overview.currentTopicId
      ? (summaryById.get(overview.currentTopicId) ?? null)
      : null;
    const recommendedTopic = recommendation.topicId
      ? (summaryById.get(recommendation.topicId) ?? null)
      : null;

    const currentMastery = overview.currentTopicId
      ? (overview.topics.find((t) => t.topicId === overview.currentTopicId)?.mastery ?? 0)
      : 0;

    return {
      userId,
      currentPhase,
      currentTopic,
      currentStage: overview.currentTopicId ? overview.currentStage : null,
      currentMastery,
      overall: overview.overall,
      recommendation,
      recommendedTopic,
      currentPhaseProgress: this.buildCurrentPhaseProgress(
        overview,
        phasesById,
        phaseProgressById,
        hoursByPhase,
      ),
      roadmap: this.buildRoadmapSummary(overview, phases, phaseProgressById),
      recentActivity,
      revision,
      retention,
    };
  },

  /** Current phase's progress framed for the Phase Progress card (adds time remaining). */
  buildCurrentPhaseProgress(
    overview: ProgressDTO,
    phasesById: Map<string, PhaseDTO>,
    phaseProgressById: Map<string, PhaseProgressDTO>,
    hoursByPhase: Map<string, number>,
  ): DashboardPhaseProgressDTO | null {
    const phaseId = overview.currentPhaseId;
    if (!phaseId) return null;
    const progress = phaseProgressById.get(phaseId);
    const phase = phasesById.get(phaseId);
    if (!progress || !phase) return null;

    const estimatedTotalHours = Math.round(hoursByPhase.get(phaseId) ?? 0);
    // Spent hours are mastery-weighted (see ProgressService); remaining is the rest.
    const estimatedTimeRemainingHours = Math.max(
      0,
      estimatedTotalHours - progress.estimatedTimeSpentHours,
    );

    return {
      ...progress,
      phase: toPhaseRef(phase)!,
      estimatedTotalHours,
      estimatedTimeRemainingHours,
    };
  },

  /** Compact all-phases roadmap with the four dashboard states. */
  buildRoadmapSummary(
    overview: ProgressDTO,
    phases: PhaseDTO[],
    phaseProgressById: Map<string, PhaseProgressDTO>,
  ): RoadmapSummaryPhaseDTO[] {
    return [...phases]
      .sort((a, b) => a.order - b.order)
      .map((phase) => {
        const progress = phaseProgressById.get(phase.id);
        return {
          phaseId: phase.id,
          title: phase.title,
          slug: phase.slug,
          order: phase.order,
          color: phase.color,
          icon: phase.icon,
          state: resolvePhaseState(phase, progress, overview.currentPhaseId),
          completionPercent: progress?.completionPercent ?? 0,
          topicsCompleted: progress?.topicsCompleted ?? 0,
          topicsTotal: progress?.topicsTotal ?? phase.topicCount,
          mastery: progress?.mastery ?? 0,
        };
      });
  },
};

/** Map the four dashboard phase states from progress + unlock signals. */
function resolvePhaseState(
  phase: PhaseDTO,
  progress: PhaseProgressDTO | undefined,
  currentPhaseId: string | null,
): RoadmapPhaseState {
  if (progress?.status === 'completed') return 'completed';
  if (phase.id === currentPhaseId) return 'current';
  if (phase.isUnlocked || progress?.status === 'in-progress') return 'unlocked';
  return 'locked';
}

function toPhaseRef(phase: PhaseDTO | undefined): PhaseRefDTO | null {
  if (!phase) return null;
  return {
    id: phase.id,
    title: phase.title,
    order: phase.order,
    slug: phase.slug,
    color: phase.color,
    icon: phase.icon,
  };
}

function unique(ids: (string | null)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}
