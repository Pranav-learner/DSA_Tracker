import { MASTERY_THRESHOLDS } from '../config/mastery.js';
import { isCompletedStatus, type TopicProgressStatus } from '../types/domain.js';
import { progressRepository, type UserRoadmapData } from '../repositories/progress.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { topicProgressRepository } from '../repositories/topicProgress.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { masteryService } from './mastery.service.js';
import { toTopicSummaryDTO, type TopicSummaryDTO } from './mappers.js';
import { ApiError } from '../utils/ApiError.js';

interface PreviousTopicState {
  status: TopicProgressStatus;
  mastery: number;
  assessmentPassed: boolean;
}

/** Group topics by phase, preserving each phase's `order`. */
function groupTopicsByPhase(data: UserRoadmapData): Map<string, UserRoadmapData['topics']> {
  const groups = new Map<string, UserRoadmapData['topics']>();
  for (const topic of data.topics) {
    const key = String(topic.phaseId);
    const list = groups.get(key) ?? [];
    list.push(topic);
    groups.set(key, list);
  }
  for (const list of groups.values()) list.sort((a, b) => a.order - b.order);
  return groups;
}

/**
 * UnlockService — the ONLY place the topic-unlock rule lives.
 *
 * A topic is unlocked when it is the first of its phase, OR the previous topic
 * is Completed/Mastered AND its mastery ≥ threshold AND its assessment passed.
 */
export const unlockService = {
  /** Pure rule: is a topic unlocked given the previous topic's state? */
  evaluate(isFirst: boolean, previous: PreviousTopicState | null): boolean {
    if (isFirst) return true;
    if (!previous) return false;
    return (
      isCompletedStatus(previous.status) &&
      previous.mastery >= MASTERY_THRESHOLDS.unlock &&
      previous.assessmentPassed
    );
  },

  /** Build a topicId → unlocked map for the whole roadmap. */
  buildUnlockMap(data: UserRoadmapData): Map<string, boolean> {
    const map = new Map<string, boolean>();
    for (const topics of groupTopicsByPhase(data).values()) {
      topics.forEach((topic, index) => {
        const prev = index > 0 ? data.progressByTopicId.get(String(topics[index - 1]._id)) : null;
        const previous: PreviousTopicState | null = prev
          ? {
              status: prev.status,
              mastery: masteryService.computeOverall(masteryService.metricsOf(prev)),
              assessmentPassed: prev.assessmentPassed,
            }
          : null;
        map.set(String(topic._id), this.evaluate(index === 0, previous));
      });
    }
    return map;
  },

  async isUnlocked(userId: string, topicId: string): Promise<boolean> {
    const data = await progressRepository.loadUserRoadmap(userId);
    return this.buildUnlockMap(data).get(topicId) ?? false;
  },

  async getUnlockedTopics(userId: string): Promise<TopicSummaryDTO[]> {
    const data = await progressRepository.loadUserRoadmap(userId);
    const map = this.buildUnlockMap(data);
    return data.topics
      .filter((t) => map.get(String(t._id)))
      .map((t) => toTopicSummaryDTO(t));
  },

  /**
   * Explicitly unlock a topic: validates the rule, then initialises progress
   * (In Progress) and points the LearningState at it. Rejects locked topics.
   */
  async unlockTopic(userId: string, topicId: string): Promise<TopicSummaryDTO> {
    const topic = await topicRepository.findById(topicId);
    if (!topic) throw ApiError.notFound(`Topic '${topicId}' not found`);

    const data = await progressRepository.loadUserRoadmap(userId);
    const unlocked = this.buildUnlockMap(data).get(topicId) ?? false;
    if (!unlocked) {
      throw new ApiError(423, 'Topic is locked — complete the previous topic to unlock it.');
    }

    const now = new Date();
    const existing = data.progressByTopicId.get(topicId);
    if (!existing || existing.status === 'Not Started') {
      await topicProgressRepository.upsert(userId, topicId, {
        status: 'In Progress',
        startedAt: existing?.startedAt ?? now,
        lastStudied: now,
        currentStage: 'recognition',
      });
    }

    await learningRepository.upsert(userId, {
      currentPhaseId: topic.phaseId,
      currentTopicId: topic._id,
      currentStage: 'recognition',
      lastActiveAt: now,
    });

    return toTopicSummaryDTO(topic);
  },
};
