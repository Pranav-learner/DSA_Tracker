import { activityService } from './activity.service.js';
import { masteryHooks } from './masteryHooks.js';
import { revisionScheduleService } from './revisionSchedule.service.js';
import { logger } from '../utils/logger.js';
import type { ProblemDocument } from '../models/Problem.js';
import type { NotebookEntryDocument } from '../models/NotebookEntry.js';

/**
 * NotebookIntegration — the modular seam between the Knowledge Engine and the
 * rest of the app, keeping NotebookService free of cross-module concerns:
 *
 *   • Activity events → the Module 1 dashboard timeline (notebook-created /
 *     notebook-updated, and problem-documented for representative problems).
 *   • Confidence → exposed to Module 1 via masteryHooks (no mastery computed).
 *
 * Effects are best-effort (activityService.record swallows errors) so they never
 * break the notebook write.
 */
export const notebookIntegration = {
  async onCreated(
    userId: string,
    { entry, problem }: { entry: NotebookEntryDocument; problem: ProblemDocument },
  ): Promise<void> {
    await activityService.record(userId, {
      type: 'notebook-created',
      entityType: 'problem',
      entityId: String(problem._id),
      title: `Documented ${problem.title}`,
      description: `Started a notebook entry for the ${entry.pattern} pattern.`,
    });
    if (problem.representative) {
      await activityService.record(userId, {
        type: 'problem-documented',
        entityType: 'problem',
        entityId: String(problem._id),
        title: `Representative problem documented`,
        description: `${problem.title} is now part of your knowledge base.`,
      });
    }
    await this.exposeConfidence(userId, entry);
    // Module 3: a new knowledge entry auto-schedules a revision (idempotent).
    await this.scheduleRevision(userId, entry);
  },

  /** Auto-create a revision schedule for a knowledge entry (best-effort). */
  async scheduleRevision(userId: string, entry: NotebookEntryDocument): Promise<void> {
    try {
      await revisionScheduleService.ensureScheduleFor(userId, {
        entityType: 'knowledgeEntry',
        entityId: String(entry._id),
        title: entry.title,
      });
    } catch (err) {
      logger.warn('Failed to auto-schedule revision for notebook entry', err);
    }
  },

  async onUpdated(
    userId: string,
    { entry, problem }: { entry: NotebookEntryDocument; problem: ProblemDocument },
  ): Promise<void> {
    await activityService.record(userId, {
      type: 'notebook-updated',
      entityType: 'problem',
      entityId: String(problem._id),
      title: `Updated notes on ${problem.title}`,
      description: `Confidence now ${entry.confidence}%.`,
    });
    await this.exposeConfidence(userId, entry);
  },

  async exposeConfidence(userId: string, entry: NotebookEntryDocument): Promise<void> {
    await masteryHooks.onNotebookConfidence(userId, {
      problemId: String(entry.problemId),
      topicId: String(entry.topicId),
      confidence: entry.confidence,
    });
  },
};
