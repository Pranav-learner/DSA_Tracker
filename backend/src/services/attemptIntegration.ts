import { activityService } from './activity.service.js';
import { masteryHooks } from './masteryHooks.js';
import { learningRepository } from '../repositories/learning.repository.js';
import type { ProblemDocument } from '../models/Problem.js';
import type { AttemptDocument } from '../models/Attempt.js';

/**
 * AttemptIntegration — the modular seam between the Attempt engine and the rest
 * of the app. It keeps AttemptService free of cross-module concerns:
 *
 *   • Activity events → the Module 1 dashboard timeline (attempt-started /
 *     attempt-updated / problem-solved).
 *   • Dashboard "current activity" → touches LearningState.lastActiveAt.
 *   • Mastery placeholder hook → masteryHooks (no mastery computed this sprint).
 *
 * All effects are best-effort via activityService.record (which swallows errors),
 * so they never break the core attempt write.
 */
export const attemptIntegration = {
  async onAttemptCreated(
    userId: string,
    { problem, attempt }: { problem: ProblemDocument; attempt: AttemptDocument },
  ): Promise<void> {
    await activityService.record(userId, {
      type: 'attempt-started',
      entityType: 'problem',
      entityId: String(problem._id),
      title: `Started an attempt on ${problem.title}`,
      description: `Attempt #${attempt.attemptNumber} · ${attempt.language}`,
    });
    if (attempt.status === 'Solved') await this.onProblemSolved(userId, problem, attempt);
  },

  async onAttemptUpdated(
    userId: string,
    {
      problem,
      attempt,
      becameSolved,
    }: { problem: ProblemDocument; attempt: AttemptDocument; becameSolved: boolean },
  ): Promise<void> {
    if (becameSolved) {
      await this.onProblemSolved(userId, problem, attempt);
      return;
    }
    await activityService.record(userId, {
      type: 'attempt-updated',
      entityType: 'problem',
      entityId: String(problem._id),
      title: `Updated an attempt on ${problem.title}`,
      description: `Attempt #${attempt.attemptNumber} · ${attempt.status} · ${attempt.verdict}`,
    });
  },

  async onProblemSolved(
    userId: string,
    problem: ProblemDocument,
    attempt: AttemptDocument,
  ): Promise<void> {
    await activityService.record(userId, {
      type: 'problem-solved',
      entityType: 'problem',
      entityId: String(problem._id),
      title: `Solved ${problem.title}`,
      description: `Cracked it in ${attempt.durationMinutes} min on attempt #${attempt.attemptNumber}.`,
    });
    // Dashboard "current activity": reflect that the learner is active now.
    await learningRepository.upsert(userId, { lastActiveAt: new Date() });
    // Mastery placeholder — intentionally computes nothing this sprint.
    await masteryHooks.onProblemSolved(userId, {
      problemId: String(problem._id),
      topicId: String(problem.topicId),
      phaseId: String(problem.phaseId),
    });
  },
};
