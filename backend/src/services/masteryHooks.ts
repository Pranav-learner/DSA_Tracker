import { logger } from '../utils/logger.js';

/**
 * Mastery placeholder hooks.
 *
 * Module 2 · Sprint 2 deliberately does NOT compute mastery from problem solving
 * — that belongs to a later sprint. This module is the modular seam where those
 * signals will be wired in: today it is a documented no-op so the integration
 * point exists and is testable without introducing mastery logic prematurely.
 */
export const masteryHooks = {
  async onProblemSolved(
    userId: string,
    ctx: { problemId: string; topicId: string; phaseId: string },
  ): Promise<void> {
    // No-op placeholder. A future sprint will translate solved problems into
    // TopicProgress mastery signals here.
    logger.debug('masteryHooks.onProblemSolved (placeholder, no-op)', { userId, ...ctx });
  },
};
