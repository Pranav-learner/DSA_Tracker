import { MASTERY_THRESHOLDS } from '../config/mastery.js';
import { isCompletedStatus, type LadderStage } from '../types/domain.js';
import { progressRepository, type UserRoadmapData } from '../repositories/progress.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { masteryService } from './mastery.service.js';
import { unlockService } from './unlock.service.js';
import type {
  OverallProgressDTO,
  PhaseProgressDTO,
  ProgressDTO,
  TopicOverlayDTO,
} from './learning.dto.js';

const round = (n: number) => Math.round(n);
const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

/**
 * ProgressService — computes the whole roadmap's per-user progress: topic
 * overlays, phase completion and overall aggregates. Every figure is derived
 * dynamically (mastery/status recomputed each call) so nothing can drift out of
 * sync. Also the single home of phase-completion logic.
 */
export const progressService = {
  async getOverview(userId: string): Promise<ProgressDTO> {
    const data = await progressRepository.loadUserRoadmap(userId);
    const unlockMap = unlockService.buildUnlockMap(data);
    const learning = await learningRepository.findByUser(userId);

    const hoursByTopic = new Map(data.topics.map((t) => [String(t._id), t.estimatedHours]));
    const lastStudiedByTopic = new Map(
      data.topics.map((t) => [String(t._id), data.progressByTopicId.get(String(t._id))?.completedAt ?? null]),
    );

    const topics = data.topics.map((t) => this.buildTopicOverlay(t, data, unlockMap));
    const overlaysById = new Map(topics.map((o) => [o.topicId, o]));

    const phases = data.phases.map((phase) => {
      const phaseTopics = topics.filter((o) => o.phaseId === String(phase._id));
      return this.buildPhaseProgress(phase, phaseTopics, hoursByTopic, lastStudiedByTopic);
    });

    const completedTopics = topics.filter((o) => isCompletedStatus(o.status)).length;
    const started = topics.filter((o) => o.status !== 'Not Started');
    const overall: OverallProgressDTO = {
      topicsTotal: topics.length,
      topicsCompleted: completedTopics,
      topicsRemaining: topics.length - completedTopics,
      phasesTotal: phases.length,
      phasesCompleted: phases.filter((p) => p.status === 'completed').length,
      completionPercent: round((completedTopics / Math.max(1, topics.length)) * 100),
      overallMastery: round(avg(topics.map((o) => o.mastery))),
      averageTopicMastery: round(avg(started.map((o) => o.mastery))),
      averageConfidence: round(avg(started.map((o) => o.confidence))),
    };

    const current = this.resolveCurrent(
      data,
      overlaysById,
      learning?.currentTopicId ? String(learning.currentTopicId) : null,
      learning?.currentStage,
    );

    return {
      overall,
      currentPhaseId: current.phaseId,
      currentTopicId: current.topicId,
      currentStage: current.stage,
      phases,
      topics,
    };
  },

  buildTopicOverlay(
    topic: UserRoadmapData['topics'][number],
    data: UserRoadmapData,
    unlockMap: Map<string, boolean>,
  ): TopicOverlayDTO {
    const doc = data.progressByTopicId.get(String(topic._id));
    const metrics = masteryService.metricsOf(doc);
    const mastery = masteryService.computeOverall(metrics);
    const threshold = topic.masteryThreshold ?? MASTERY_THRESHOLDS.completion;
    return {
      topicId: String(topic._id),
      phaseId: String(topic.phaseId),
      order: topic.order,
      status: masteryService.deriveStatus(mastery, metrics, threshold),
      mastery,
      confidence: metrics.confidence,
      assessmentPassed: masteryService.assessmentPassed(metrics),
      unlocked: unlockMap.get(String(topic._id)) ?? false,
      currentStage: masteryService.currentStage(metrics),
    };
  },

  buildPhaseProgress(
    phase: UserRoadmapData['phases'][number],
    phaseTopics: TopicOverlayDTO[],
    hoursByTopic: Map<string, number>,
    completedAtByTopic: Map<string, Date | null>,
  ): PhaseProgressDTO {
    const total = phaseTopics.length;
    const completed = phaseTopics.filter((o) => isCompletedStatus(o.status)).length;
    const mastery = round(avg(phaseTopics.map((o) => o.mastery)));
    const threshold = phase.masteryThreshold ?? MASTERY_THRESHOLDS.phaseCompletion;

    const isCompleted = total > 0 && completed === total && mastery >= threshold;
    const anyStarted = phaseTopics.some((o) => o.status !== 'Not Started');

    // Estimated time spent ≈ each topic's hours scaled by its mastery fraction.
    const estimatedTimeSpentHours = round(
      phaseTopics.reduce((acc, o) => acc + (o.mastery / 100) * (hoursByTopic.get(o.topicId) ?? 0), 0),
    );

    let lastCompletedAt: Date | null = null;
    for (const o of phaseTopics) {
      const at = completedAtByTopic.get(o.topicId);
      if (at && (!lastCompletedAt || at > lastCompletedAt)) lastCompletedAt = at;
    }

    return {
      phaseId: String(phase._id),
      status: isCompleted ? 'completed' : anyStarted ? 'in-progress' : 'locked',
      completionPercent: round((completed / Math.max(1, total)) * 100),
      mastery,
      topicsCompleted: completed,
      topicsTotal: total,
      estimatedTimeSpentHours,
      completedAt: isCompleted && lastCompletedAt ? lastCompletedAt.toISOString() : null,
    };
  },

  /** Resolve the learner's current position (pointer, or first actionable topic). */
  resolveCurrent(
    data: UserRoadmapData,
    overlaysById: Map<string, TopicOverlayDTO>,
    pointerTopicId: string | null,
    pointerStage: LadderStage | undefined,
  ): { phaseId: string | null; topicId: string | null; stage: LadderStage } {
    if (pointerTopicId && overlaysById.has(pointerTopicId)) {
      const overlay = overlaysById.get(pointerTopicId)!;
      return {
        phaseId: overlay.phaseId,
        topicId: pointerTopicId,
        stage: pointerStage ?? overlay.currentStage,
      };
    }
    // Fallback: first unlocked, not-yet-completed topic in roadmap order.
    const phaseOrderOf = (phaseId: unknown) =>
      data.phases.find((p) => String(p._id) === String(phaseId))?.order ?? 0;
    const ordered = [...data.topics].sort((a, b) =>
      String(a.phaseId) === String(b.phaseId)
        ? a.order - b.order
        : phaseOrderOf(a.phaseId) - phaseOrderOf(b.phaseId),
    );
    for (const t of ordered) {
      const overlay = overlaysById.get(String(t._id));
      if (overlay && overlay.unlocked && !isCompletedStatus(overlay.status)) {
        return { phaseId: overlay.phaseId, topicId: overlay.topicId, stage: overlay.currentStage };
      }
    }
    return { phaseId: null, topicId: null, stage: 'recognition' };
  },
};
