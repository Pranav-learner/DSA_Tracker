import { Types } from 'mongoose';
import { upsolveTaskRepository } from '../repositories/upsolveTask.repository.js';
import { contestProblemRepository } from '../repositories/contestProblem.repository.js';
import { requireOwnedContest } from './contest.service.js';
import { topicProgressService } from '../../services/topicProgress.service.js';
import { topicProgressRepository } from '../../repositories/topicProgress.repository.js';
import { masteryService } from '../../services/mastery.service.js';
import { revisionScheduleService } from '../../services/revisionSchedule.service.js';
import { revisionScheduleRepository } from '../../repositories/revisionSchedule.repository.js';
import { notebookRepository } from '../../repositories/notebook.repository.js';
import { activityService } from '../../services/activity.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import type { ContestProblemDocument } from '../../models/ContestProblem.js';
import type { UpsolveTaskDocument, IUpsolveTask } from '../../models/UpsolveTask.js';
import type { UpsolvePriority } from '../../types/domain.js';
import type { CreateUpsolveBody, UpdateUpsolveBody, UpsolveQuery } from '../validators/contestLearning.validator.js';
import type { UpsolveTaskDTO, UpsolveQueueDTO } from '../dto/learning.dto.js';
import type { FilterQuery } from 'mongoose';

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const MASTERY_BUMP = 8; // upsolving nudges the practice metrics up

function toDTO(doc: UpsolveTaskDocument): UpsolveTaskDTO {
  return {
    id: String(doc._id),
    contestRef: String(doc.contestRef),
    contestProblemRef: String(doc.contestProblemRef),
    topicId: doc.topicId ? String(doc.topicId) : null,
    pattern: doc.pattern,
    priority: doc.priority,
    status: doc.status,
    estimatedTime: doc.estimatedTime,
    linkedKnowledgeEntry: doc.linkedKnowledgeEntry ? String(doc.linkedKnowledgeEntry) : null,
    linkedRevisionSchedule: doc.linkedRevisionSchedule ? String(doc.linkedRevisionSchedule) : null,
    problemCode: doc.problemCode,
    problemName: doc.problemName,
    url: doc.url,
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Priority + estimate heuristics from a contest problem's outcome/difficulty. */
export function derivePriority(p: ContestProblemDocument): UpsolvePriority {
  if (p.attempted || p.attempts > 0) return 'high'; // came close → most valuable to finish
  if (p.skipped) return 'medium';
  return 'low';
}
export function deriveEstimate(difficulty: string): number {
  const n = Number(difficulty);
  if (!Number.isFinite(n) || n === 0) return 45;
  if (n < 1200) return 30;
  if (n < 1800) return 45;
  return 60;
}

async function requireOwnedTask(userId: string, id: string): Promise<UpsolveTaskDocument> {
  const doc = await upsolveTaskRepository.findById(id);
  if (!doc) throw ApiError.notFound(`Upsolve task '${id}' not found`);
  if (doc.userId !== userId) throw new ApiError(403, 'You do not own this task');
  return doc;
}

/**
 * UpsolveService — manages upsolve tasks and, on completion, SYNCHRONISES the
 * Learning Engine by reusing existing services: mastery (TopicProgressService),
 * spaced revision (RevisionScheduleService), knowledge (notebook link) and
 * activity. It owns no mastery/revision math of its own.
 */
export const upsolveService = {
  async createForProblem(userId: string, contestId: string, body: CreateUpsolveBody): Promise<UpsolveTaskDTO> {
    await requireOwnedContest(userId, contestId);
    const problem = await contestProblemRepository.findById(body.contestProblemRef);
    if (!problem || problem.userId !== userId || String(problem.contestRef) !== contestId) {
      throw ApiError.notFound('Contest problem not found for this contest');
    }
    const existing = await upsolveTaskRepository.findByProblem(userId, body.contestProblemRef);
    if (existing) throw new ApiError(409, 'An upsolve task already exists for this problem');

    const doc = await upsolveTaskRepository.create({
      contestRef: new Types.ObjectId(contestId),
      contestProblemRef: problem._id,
      userId,
      topicId: body.topicId ? new Types.ObjectId(body.topicId) : null,
      pattern: body.pattern ?? problem.tags[0] ?? problem.difficulty ?? '',
      priority: body.priority ?? derivePriority(problem),
      status: 'Pending',
      estimatedTime: body.estimatedTime ?? deriveEstimate(problem.difficulty),
      problemCode: problem.problemCode,
      problemName: problem.problemName,
      url: problem.url,
    });
    await activityService.record(userId, { type: 'upsolve-created', entityType: 'contest', entityId: contestId, title: `Upsolve queued: ${problem.problemName}`, description: doc.pattern });
    return toDTO(doc);
  },

  async list(userId: string, query: UpsolveQuery = {}): Promise<UpsolveTaskDTO[]> {
    const filter: FilterQuery<IUpsolveTask> = {};
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.contestId) filter.contestRef = new Types.ObjectId(query.contestId);
    const docs = await upsolveTaskRepository.findAll(userId, filter);
    return docs.map(toDTO);
  },

  async getById(userId: string, id: string): Promise<UpsolveTaskDTO> {
    return toDTO(await requireOwnedTask(userId, id));
  },

  async update(userId: string, id: string, body: UpdateUpsolveBody): Promise<UpsolveTaskDTO> {
    const task = await requireOwnedTask(userId, id);
    if (body.status === 'Completed' && task.status !== 'Completed') {
      return toDTO(await this.completeTask(userId, task, body));
    }
    const patch: Partial<IUpsolveTask> = {};
    if (body.status) patch.status = body.status;
    if (body.priority) patch.priority = body.priority;
    if (body.pattern !== undefined) patch.pattern = body.pattern;
    if (body.estimatedTime !== undefined) patch.estimatedTime = body.estimatedTime;
    if (body.topicId !== undefined) patch.topicId = body.topicId ? new Types.ObjectId(body.topicId) : null;
    return toDTO((await upsolveTaskRepository.updateById(id, patch)) as UpsolveTaskDocument);
  },

  /**
   * Complete an upsolve task and synchronise the Learning Engine. Every side
   * effect reuses an existing service; each is best-effort so completion never
   * fails on a downstream hiccup.
   */
  async completeTask(userId: string, task: UpsolveTaskDocument, body: UpdateUpsolveBody = {}): Promise<UpsolveTaskDocument> {
    const patch: Partial<IUpsolveTask> = { status: 'Completed', completedAt: new Date() };
    if (body.priority) patch.priority = body.priority;
    const topicId = body.topicId !== undefined ? body.topicId : task.topicId ? String(task.topicId) : null;
    if (body.topicId !== undefined) patch.topicId = body.topicId ? new Types.ObjectId(body.topicId) : null;

    if (topicId) {
      // 1) Mastery — nudge the practice metrics up via the Module-1 engine.
      try {
        const tp = await topicProgressRepository.findByUserAndTopic(userId, topicId);
        const m = masteryService.metricsOf(tp);
        await topicProgressService.applyUpdate(userId, topicId, {
          standard: clamp(m.standard + MASTERY_BUMP),
          implementation: clamp(m.implementation + MASTERY_BUMP),
        });
      } catch (err) {
        logger.warn('Upsolve mastery sync skipped (topic locked?)', err);
      }

      // 2) Revision — enrol the topic in the spaced-review loop (Module 3).
      try {
        const created = await revisionScheduleService.ensureScheduleFor(userId, {
          entityType: 'topic',
          entityId: topicId,
          title: task.problemName || 'Upsolved topic',
          priority: 3,
        });
        const scheduleId = created?.id ?? (await revisionScheduleRepository.findActiveForEntity(userId, 'topic', topicId))?.id;
        if (scheduleId) patch.linkedRevisionSchedule = new Types.ObjectId(scheduleId);
      } catch (err) {
        logger.warn('Upsolve revision sync skipped', err);
      }

      // 3) Knowledge — link the topic's notebook entry if one exists (Module 2).
      const entry = await notebookRepository.findFirstByTopic(userId, topicId);
      if (entry) {
        patch.linkedKnowledgeEntry = entry._id;
        await activityService.record(userId, { type: 'contest-knowledge-added', entityType: 'contest', entityId: String(task.contestRef), title: `Knowledge linked: ${task.problemName}`, description: 'Upsolve linked to your notebook.' });
      }
    }

    const updated = (await upsolveTaskRepository.updateById(String(task._id), patch)) as UpsolveTaskDocument;
    await activityService.record(userId, { type: 'upsolve-completed', entityType: 'contest', entityId: String(task.contestRef), title: `Upsolved ${task.problemName}`, description: task.pattern });
    return updated;
  },

  async queue(userId: string): Promise<UpsolveQueueDTO> {
    const [tasks, counts] = await Promise.all([upsolveTaskRepository.findAll(userId), upsolveTaskRepository.statusCounts(userId)]);
    const by = (s: string) => tasks.filter((t) => t.status === s).map(toDTO);
    const pending = by('Pending');
    const inProgress = by('In Progress');
    return {
      pending,
      inProgress,
      completed: by('Completed'),
      skipped: by('Skipped'),
      counts: {
        pending: counts.Pending ?? 0,
        inProgress: counts['In Progress'] ?? 0,
        completed: counts.Completed ?? 0,
        skipped: counts.Skipped ?? 0,
        total: tasks.length,
      },
      estimatedRemainingMinutes: [...pending, ...inProgress].reduce((s, t) => s + t.estimatedTime, 0),
    };
  },
};
