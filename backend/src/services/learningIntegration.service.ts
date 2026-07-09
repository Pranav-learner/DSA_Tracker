import { progressService } from './progress.service.js';
import { recommendationService } from './recommendation.service.js';
import { topicProgressService } from './topicProgress.service.js';
import { unlockService } from './unlock.service.js';
import { activityService } from './activity.service.js';
import { revisionScheduleService } from './revisionSchedule.service.js';
import { problemRepository } from '../repositories/problem.repository.js';
import { notebookRepository } from '../repositories/notebook.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { isCompletedStatus, type Difficulty, type MasteryMetrics, type ProblemLearningStatus } from '../types/domain.js';
import type { ProblemDocument } from '../models/Problem.js';
import type { NotebookEntryDocument } from '../models/NotebookEntry.js';
import type { ProgressDTO, RecommendationDTO } from './learning.dto.js';
import type { LearningImpactDTO } from './workspace.dto.js';

/** Mastery signal gained per solved problem, by difficulty (integration policy). */
const DIFFICULTY_GAIN: Record<Difficulty, number> = {
  Beginner: 6,
  Easy: 8,
  Medium: 12,
  Hard: 16,
  Expert: 20,
};

/**
 * LearningIntegrationService — the single orchestrator that connects the Problem
 * Library / Attempt / Notebook engines to Module 1. When a problem is solved it
 * drives the whole chain by **reusing existing services** (no duplicated logic,
 * no rewrite of Module 1):
 *
 *   solve → feed mastery signal → topicProgressService.applyUpdate
 *          (recomputes mastery + status, advances LearningState, fires topic
 *           activity) → recommendation refresh → activity → learning impact.
 *
 * It also owns the read-side impact snapshot and the derived 5-state problem
 * status. All orchestration lives here — never in controllers.
 */
export const learningIntegrationService = {
  /**
   * React to a problem's first solve: translate it into a bounded mastery signal
   * and run it through Module 1's mastery engine, then refresh recommendation and
   * report the before/after impact. Locked topics are skipped gracefully.
   */
  async applyLearningImpact(userId: string, problem: ProblemDocument): Promise<LearningImpactDTO> {
    const topicId = String(problem.topicId);
    const problemId = String(problem._id);

    const before = await progressService.getOverview(userId);
    const beforeRec = recommendationService.build(before);
    const masteryBefore = before.topics.find((t) => t.topicId === topicId)?.mastery ?? 0;

    const unlocked = await unlockService.isUnlocked(userId, topicId);
    if (unlocked) {
      const [tp, notebook] = await Promise.all([
        topicProgressService.get(userId, topicId),
        notebookRepository.findByUserAndProblem(userId, problemId),
      ]);
      const patch = computeMetricPatch(problem.difficulty, tp.metrics, notebook?.confidence ?? null);
      // Reuse Module 1's engine — it recomputes mastery/status, advances the
      // learner's pointer and records topic-progress activity.
      await topicProgressService.applyUpdate(userId, topicId, patch);
    }

    const after = await progressService.getOverview(userId);
    const afterRec = recommendationService.build(after);

    if (recommendationChanged(beforeRec, afterRec)) {
      await activityService.record(userId, {
        type: 'recommendation-updated',
        entityType: 'problem',
        entityId: problemId,
        title: 'Your next best action changed',
        description: afterRec.title,
      });
    }

    const impact = this.buildImpact(after, topicId, problemId, masteryBefore, afterRec);

    // Module 3: a completed topic auto-schedules a revision (idempotent).
    if (impact.topicCompleted) await scheduleTopicRevision(userId, topicId);

    return impact;
  },

  /** Read-only impact snapshot for a problem (no before/delta). */
  async getLearningImpact(userId: string, problemId: string): Promise<LearningImpactDTO> {
    const problem = await problemRepository.findById(problemId);
    if (!problem) throw ApiError.notFound(`Problem '${problemId}' not found`);
    const overview = await progressService.getOverview(userId);
    return this.buildImpact(overview, String(problem.topicId), problemId, null);
  },

  /** Pure impact builder from an already-loaded overview. */
  buildImpact(
    overview: ProgressDTO,
    topicId: string,
    problemId: string,
    masteryBefore: number | null,
    rec?: RecommendationDTO,
  ): LearningImpactDTO {
    const recommendation = rec ?? recommendationService.build(overview);
    const topicOverlay = overview.topics.find((t) => t.topicId === topicId) ?? null;
    const phase = topicOverlay
      ? (overview.phases.find((p) => p.phaseId === topicOverlay.phaseId) ?? null)
      : null;
    const currentMastery = topicOverlay?.mastery ?? 0;

    return {
      problemId,
      currentMastery,
      masteryBefore,
      masteryDelta: masteryBefore != null ? currentMastery - masteryBefore : null,
      topicCompleted: topicOverlay ? isCompletedStatus(topicOverlay.status) : false,
      topicProgress: topicOverlay
        ? {
            topicId,
            status: topicOverlay.status,
            mastery: topicOverlay.mastery,
            completionPercent: phase?.completionPercent ?? 0,
            topicsCompleted: phase?.topicsCompleted ?? 0,
            topicsTotal: phase?.topicsTotal ?? 0,
          }
        : null,
      dashboard: {
        overallMastery: overview.overall.overallMastery,
        completionPercent: overview.overall.completionPercent,
        topicsCompleted: overview.overall.topicsCompleted,
        topicsRemaining: overview.overall.topicsRemaining,
      },
      recommendation,
    };
  },

  /**
   * Derive the 5-state workspace problem status. "Mastered" requires the problem
   * to be Solved AND documented with the required metadata (validation rule).
   */
  deriveLearningStatus(
    input: { solved: boolean; totalAttempts: number },
    notebook: NotebookEntryDocument | null,
  ): ProblemLearningStatus {
    const hasNotebook = Boolean(notebook);
    const metaComplete =
      hasNotebook && Boolean(notebook!.observation.trim()) && Boolean(notebook!.coreAlgorithm.trim());
    if (input.solved && metaComplete) return 'Mastered';
    if (input.solved) return 'Solved';
    if (input.totalAttempts > 0) return 'Attempting';
    if (hasNotebook) return 'Learning';
    return 'Not Started';
  },
};

/** Bounded, difficulty-scaled increment to the practice metrics (never > 100). */
function computeMetricPatch(
  difficulty: Difficulty,
  metrics: MasteryMetrics,
  notebookConfidence: number | null,
): Partial<MasteryMetrics> {
  const gain = DIFFICULTY_GAIN[difficulty];
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return {
    recognition: clamp(metrics.recognition + gain),
    implementation: clamp(metrics.implementation + gain),
    standard: clamp(metrics.standard + gain),
    variant: clamp(metrics.variant + Math.round(gain * 0.6)),
    mixed: clamp(metrics.mixed + Math.round(gain * 0.4)),
    confidence: notebookConfidence != null ? Math.max(metrics.confidence, notebookConfidence) : metrics.confidence,
  };
}

function recommendationChanged(a: RecommendationDTO, b: RecommendationDTO): boolean {
  return a.type !== b.type || a.topicId !== b.topicId;
}

/** Auto-schedule a revision when a topic completes (best-effort, idempotent). */
async function scheduleTopicRevision(userId: string, topicId: string): Promise<void> {
  try {
    const topic = await topicRepository.findById(topicId);
    if (!topic) return;
    await revisionScheduleService.ensureScheduleFor(userId, {
      entityType: 'topic',
      entityId: topicId,
      title: topic.title,
    });
  } catch (err) {
    logger.warn('Failed to auto-schedule revision for completed topic', err);
  }
}
