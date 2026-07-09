import { activityService } from './activity.service.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { learningIntegrationService } from './learningIntegration.service.js';
import type { ProblemDocument } from '../models/Problem.js';
import type { AttemptDocument } from '../models/Attempt.js';

/**
 * AttemptIntegration — the modular seam between the Attempt engine and the rest
 * of the app. Keeps AttemptService free of cross-module concerns:
 *
 *   • Activity events → the Module 1 dashboard timeline.
 *   • On a problem's FIRST solve → hand off to the LearningIntegrationService,
 *     which drives the full chain (TopicProgress → mastery → recommendation …).
 *
 * `firstSolve` is problem-level (computed by AttemptService) so the learning
 * impact fires exactly once per problem, never on later upsolves.
 */
export const attemptIntegration = {
  async onAttemptCreated(
    userId: string,
    { problem, attempt, firstSolve }: { problem: ProblemDocument; attempt: AttemptDocument; firstSolve: boolean },
  ): Promise<void> {
    await activityService.record(userId, {
      type: 'attempt-started',
      entityType: 'problem',
      entityId: String(problem._id),
      title: `Started an attempt on ${problem.title}`,
      description: `Attempt #${attempt.attemptNumber} · ${attempt.language}`,
    });
    if (firstSolve) await this.onProblemSolved(userId, problem, attempt);
  },

  async onAttemptUpdated(
    userId: string,
    { problem, attempt, firstSolve }: { problem: ProblemDocument; attempt: AttemptDocument; firstSolve: boolean },
  ): Promise<void> {
    if (firstSolve) {
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

  async onProblemSolved(userId: string, problem: ProblemDocument, attempt: AttemptDocument): Promise<void> {
    await activityService.record(userId, {
      type: 'problem-solved',
      entityType: 'problem',
      entityId: String(problem._id),
      title: `Solved ${problem.title}`,
      description: `Cracked it in ${attempt.durationMinutes} min on attempt #${attempt.attemptNumber}.`,
    });
    await learningRepository.upsert(userId, { lastActiveAt: new Date() });

    // Drive the full Learning Integration chain (TopicProgress → mastery →
    // recommendation → activity). All orchestration lives in that service.
    await learningIntegrationService.applyLearningImpact(userId, problem);
  },
};
