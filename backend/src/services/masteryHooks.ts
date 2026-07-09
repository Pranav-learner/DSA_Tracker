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

  /**
   * Module 2 · Sprint 3 — exposes a notebook confidence update to Module 1.
   * Placeholder only: mastery is NOT recalculated from confidence this sprint.
   */
  async onNotebookConfidence(
    userId: string,
    ctx: { problemId: string; topicId: string; confidence: number },
  ): Promise<void> {
    logger.debug('masteryHooks.onNotebookConfidence (placeholder, no-op)', { userId, ...ctx });
  },
};
