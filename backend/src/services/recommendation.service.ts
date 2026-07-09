import { MASTERY_THRESHOLDS } from '../config/mastery.js';
import { isCompletedStatus } from '../types/domain.js';
import { progressService } from './progress.service.js';
import type { ProgressDTO, RecommendationDTO, TopicOverlayDTO } from './learning.dto.js';

/**
 * RecommendationService — rule-based (NO AI) next-best-action.
 *
 * Priority: start → continue current → complete assessment → next unlocked →
 * phase reflection. Pure `build()` keeps it testable; `get()` wraps it with data.
 */
export const recommendationService = {
  async get(userId: string): Promise<RecommendationDTO> {
    return this.build(await progressService.getOverview(userId));
  },

  build(overview: ProgressDTO): RecommendationDTO {
    const { topics, currentTopicId } = overview;
    const current = currentTopicId ? topics.find((t) => t.topicId === currentTopicId) : undefined;
    const anyStarted = topics.some((t) => t.status !== 'Not Started');

    // 1. Fresh start — nothing attempted yet.
    if (!anyStarted) {
      const first = topics.find((t) => t.unlocked) ?? null;
      return rec('start-learning', 'Start your journey', 'Begin with your first unlocked topic to kick off the roadmap.', first, 'Start learning');
    }

    // 2. There is a current topic that isn't finished.
    if (current && !isCompletedStatus(current.status)) {
      const nearlyThere = current.mastery >= MASTERY_THRESHOLDS.completion - 15;
      if (nearlyThere && !current.assessmentPassed) {
        return rec('complete-assessment', 'Take the assessment', 'You are close — pass the assessment to complete this topic.', current, 'Go to assessment');
      }
      return rec('continue-topic', 'Continue learning', 'Pick up where you left off and push this topic further.', current, 'Continue topic');
    }

    // 3. Move on to the next unlocked, unfinished topic.
    const next = topics.find((t) => t.unlocked && !isCompletedStatus(t.status));
    if (next) {
      return rec('next-topic', 'Move to the next topic', 'Your current topic is done — advance to the next unlocked topic.', next, 'Open next topic');
    }

    // 4. Something is done-but-not-assessed anywhere.
    const needsAssessment = topics.find(
      (t) => t.unlocked && !t.assessmentPassed && t.mastery >= MASTERY_THRESHOLDS.completion - 15,
    );
    if (needsAssessment) {
      return rec('complete-assessment', 'Take an assessment', 'Lock in your progress by passing a pending assessment.', needsAssessment, 'Go to assessment');
    }

    // 5. Everything unlocked is complete — reflect.
    return rec(
      'phase-reflection',
      'Reflect on your progress',
      'You have completed everything available. Review your phase before the next unlocks.',
      null,
      'View roadmap',
    );
  },
};

function rec(
  type: RecommendationDTO['type'],
  title: string,
  message: string,
  topic: TopicOverlayDTO | null,
  actionLabel: string,
): RecommendationDTO {
  return {
    type,
    title,
    message,
    topicId: topic?.topicId ?? null,
    phaseId: topic?.phaseId ?? null,
    actionLabel,
    actionTo: topic ? `/topic/${topic.topicId}` : '/roadmap',
  };
}
