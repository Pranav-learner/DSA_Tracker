import { DEFAULT_MASTERY_WEIGHTS, MASTERY_THRESHOLDS } from '../config/mastery.js';
import { isCompletedStatus, type MasteryMetrics } from '../types/domain.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { topicProgressRepository } from '../repositories/topicProgress.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { masteryService } from './mastery.service.js';
import { unlockService } from './unlock.service.js';
import { activityService } from './activity.service.js';
import { ApiError } from '../utils/ApiError.js';
import type { TopicProgressDocument } from '../models/TopicProgress.js';
import type { ITopic } from '../models/Topic.js';
import type { HydratedDocument } from 'mongoose';
import type { ActivityInput } from '../repositories/activity.repository.js';
import type { TopicProgressStatus } from '../types/domain.js';
import type { MasteryDTO, TopicProgressDTO } from './learning.dto.js';

type TopicDoc = HydratedDocument<ITopic>;

/**
 * TopicProgressService — read/update a user's mastery record for a topic.
 * All mastery math is delegated to MasteryService; unlock checks to
 * UnlockService. Controllers never compute any of this.
 */
export const topicProgressService = {
  async get(userId: string, topicId: string): Promise<TopicProgressDTO> {
    const topic = await requireTopic(topicId);
    const [doc, unlocked] = await Promise.all([
      topicProgressRepository.findByUserAndTopic(userId, topicId),
      unlockService.isUnlocked(userId, topicId),
    ]);
    return buildProgressDTO(userId, topic, doc, unlocked);
  },

  async getMastery(userId: string, topicId: string): Promise<MasteryDTO> {
    const topic = await requireTopic(topicId);
    const doc = await topicProgressRepository.findByUserAndTopic(userId, topicId);
    const metrics = masteryService.metricsOf(doc);
    const overall = masteryService.computeOverall(metrics);
    const threshold = topic.masteryThreshold ?? MASTERY_THRESHOLDS.completion;
    return {
      topicId,
      overallMastery: overall,
      status: masteryService.deriveStatus(overall, metrics, threshold),
      metrics,
      weights: DEFAULT_MASTERY_WEIGHTS,
      ladder: masteryService.deriveLadder(metrics, doc),
    };
  },

  /**
   * Apply a partial metric update (shared by PATCH /progress and /mastery).
   * Validates the topic is unlocked, recomputes everything and advances the
   * learner's pointer.
   */
  async applyUpdate(
    userId: string,
    topicId: string,
    patch: Partial<MasteryMetrics>,
  ): Promise<TopicProgressDTO> {
    const topic = await requireTopic(topicId);

    const unlocked = await unlockService.isUnlocked(userId, topicId);
    if (!unlocked) {
      throw new ApiError(423, 'Topic is locked — it cannot be updated until unlocked.');
    }

    const existing = await topicProgressRepository.findByUserAndTopic(userId, topicId);
    const merged: MasteryMetrics = { ...masteryService.metricsOf(existing), ...clampMetrics(patch) };

    const overall = masteryService.computeOverall(merged);
    const threshold = topic.masteryThreshold ?? MASTERY_THRESHOLDS.completion;
    const status = masteryService.deriveStatus(overall, merged, threshold);
    const currentStage = masteryService.currentStage(merged);
    const now = new Date();
    const done = isCompletedStatus(status);

    const saved = await topicProgressRepository.upsert(userId, topicId, {
      ...masteryService.metricsToScores(merged),
      overallMastery: overall,
      assessmentPassed: masteryService.assessmentPassed(merged),
      currentStage,
      status,
      startedAt: existing?.startedAt ?? now,
      lastStudied: now,
      completedAt: done ? (existing?.completedAt ?? now) : null,
    });

    await learningRepository.upsert(userId, {
      currentPhaseId: topic.phaseId,
      currentTopicId: topic._id,
      currentStage,
      lastActiveAt: now,
    });

    // Log a recent-activity event for the transition (best-effort; never blocks).
    const event = activityFor(topic, existing?.status ?? 'Not Started', status);
    if (event) await activityService.record(userId, event);

    return buildProgressDTO(userId, topic, saved, true);
  },
};

/**
 * Derive the single most-significant activity event for a status transition, or
 * null when nothing noteworthy changed. Orchestration only — no mastery rules.
 */
function activityFor(
  topic: TopicDoc,
  prev: TopicProgressStatus,
  next: TopicProgressStatus,
): ActivityInput | null {
  const base = { entityType: 'topic' as const, entityId: String(topic._id) };
  if (next === 'Mastered' && prev !== 'Mastered') {
    return { ...base, type: 'topic-mastered', title: `Mastered ${topic.title}`, description: 'Reached mastery on this topic.' };
  }
  if (isCompletedStatus(next) && !isCompletedStatus(prev)) {
    return { ...base, type: 'topic-completed', title: `Completed ${topic.title}`, description: 'Marked this topic as completed.' };
  }
  if (prev === 'Not Started' && next !== 'Not Started') {
    return { ...base, type: 'topic-started', title: `Started ${topic.title}`, description: 'Began working through this topic.' };
  }
  if (next === 'In Progress') {
    return { ...base, type: 'mastery-updated', title: `Updated mastery on ${topic.title}`, description: 'Logged new progress on this topic.' };
  }
  return null;
}

async function requireTopic(topicId: string): Promise<TopicDoc> {
  const topic = await topicRepository.findById(topicId);
  if (!topic) throw ApiError.notFound(`Topic '${topicId}' not found`);
  return topic;
}

function clampMetrics(patch: Partial<MasteryMetrics>): Partial<MasteryMetrics> {
  const out: Partial<MasteryMetrics> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      out[key as keyof MasteryMetrics] = Math.max(0, Math.min(100, value));
    }
  }
  return out;
}

function buildProgressDTO(
  userId: string,
  topic: TopicDoc,
  doc: TopicProgressDocument | null,
  unlocked: boolean,
): TopicProgressDTO {
  const metrics = masteryService.metricsOf(doc);
  const overall = masteryService.computeOverall(metrics);
  const threshold = topic.masteryThreshold ?? MASTERY_THRESHOLDS.completion;
  const status = doc ? masteryService.deriveStatus(overall, metrics, threshold) : 'Not Started';
  return {
    userId,
    topicId: String(topic._id),
    status,
    overallMastery: overall,
    currentStage: doc?.currentStage ?? masteryService.currentStage(metrics),
    metrics,
    assessmentPassed: masteryService.assessmentPassed(metrics),
    unlocked,
    ladder: masteryService.deriveLadder(metrics, doc),
    startedAt: doc?.startedAt ? doc.startedAt.toISOString() : null,
    lastStudied: doc?.lastStudied ? doc.lastStudied.toISOString() : null,
    completedAt: doc?.completedAt ? doc.completedAt.toISOString() : null,
  };
}
