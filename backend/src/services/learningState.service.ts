import { phaseRepository } from '../repositories/phase.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { progressService } from './progress.service.js';
import { recommendationService } from './recommendation.service.js';
import { toPhaseRefDTO, toTopicSummaryDTO } from './mappers.js';
import type { LearningStateDTO } from './learning.dto.js';

/**
 * LearningStateService — the "where am I" composition: current position +
 * overall progress + next recommendation, in a single response for the
 * dashboard. Composes ProgressService & RecommendationService (no DB access of
 * its own beyond resolving the current phase/topic references).
 */
export const learningStateService = {
  async get(userId: string): Promise<LearningStateDTO> {
    const overview = await progressService.getOverview(userId);
    const recommendation = recommendationService.build(overview);

    const [phase, topic] = await Promise.all([
      overview.currentPhaseId ? phaseRepository.findById(overview.currentPhaseId) : Promise.resolve(null),
      overview.currentTopicId ? topicRepository.findById(overview.currentTopicId) : Promise.resolve(null),
    ]);

    const currentMastery = overview.currentTopicId
      ? (overview.topics.find((t) => t.topicId === overview.currentTopicId)?.mastery ?? 0)
      : 0;

    return {
      userId,
      currentPhase: phase ? toPhaseRefDTO(phase) : null,
      currentTopic: topic ? toTopicSummaryDTO(topic) : null,
      currentStage: overview.currentTopicId ? overview.currentStage : null,
      currentMastery,
      overall: overview.overall,
      recommendation,
    };
  },
};
