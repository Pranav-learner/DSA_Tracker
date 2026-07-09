import { Types } from 'mongoose';
import { contestService, requireOwnedContest } from './contest.service.js';
import { contestPerformanceService } from './contestPerformance.service.js';
import { contestTimelineService } from './contestTimeline.service.js';
import { contestProblemRepository } from '../repositories/contestProblem.repository.js';
import { activityService } from '../../services/activity.service.js';
import { ApiError } from '../../utils/ApiError.js';
import type { ContestProblemDocument, IContestProblem } from '../../models/ContestProblem.js';
import type { CreateProblemBody, UpdateProblemBody, CreateTimelineEventBody } from '../validators/contestWorkspace.validator.js';
import type {
  ContestProblemDTO,
  ContestProblemStatus,
  ContestStatisticsDTO,
  ContestTimelineEventDTO,
  ContestWorkspaceDTO,
} from '../dto/workspace.dto.js';

const round = (n: number) => Math.round(n);

function statusOf(p: ContestProblemDocument): ContestProblemStatus {
  if (p.solved) return 'solved';
  if (p.skipped) return 'skipped';
  if (p.attempted || p.attempts > 0) return 'attempted';
  return 'unattempted';
}

function toProblemDTO(doc: ContestProblemDocument): ContestProblemDTO {
  return {
    id: String(doc._id),
    contestRef: String(doc.contestRef),
    problemCode: doc.problemCode,
    problemName: doc.problemName,
    platformProblemId: doc.platformProblemId,
    url: doc.url,
    index: doc.index,
    difficulty: doc.difficulty,
    tags: doc.tags,
    solved: doc.solved,
    skipped: doc.skipped,
    attempted: doc.attempted,
    attempts: doc.attempts,
    firstAttemptAt: doc.firstAttemptAt ? doc.firstAttemptAt.toISOString() : null,
    solvedAt: doc.solvedAt ? doc.solvedAt.toISOString() : null,
    totalTimeSpent: doc.totalTimeSpent,
    penalty: doc.penalty,
    status: statusOf(doc),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function requireOwnedProblem(userId: string, problemId: string): Promise<ContestProblemDocument> {
  const doc = await contestProblemRepository.findById(problemId);
  if (!doc) throw ApiError.notFound(`Contest problem '${problemId}' not found`);
  if (doc.userId !== userId) throw new ApiError(403, 'You do not own this problem');
  return doc;
}

function statistics(problems: ContestProblemDTO[], averageSolveTime: number, durationMinutes: number): ContestStatisticsDTO {
  const attempted = problems.filter((p) => p.attempted || p.attempts > 0 || p.solved).length;
  const solved = problems.filter((p) => p.solved).length;
  const skipped = problems.filter((p) => p.skipped).length;
  const totalAttempts = problems.reduce((s, p) => s + p.attempts, 0);
  const durationHours = durationMinutes > 0 ? durationMinutes / 60 : 1;
  return {
    acceptanceRate: attempted ? round((solved / attempted) * 100) : 0,
    problemsAttempted: attempted,
    problemsSkipped: skipped,
    averageAttempts: attempted ? Math.round((totalAttempts / attempted) * 10) / 10 : 0,
    averageSolveTime,
    contestEfficiency: problems.length ? round((solved / problems.length) * 100) : 0,
    contestPace: Math.round((solved / durationHours) * 10) / 10,
  };
}

/**
 * ContestWorkspaceService — aggregates a contest into a complete workspace and
 * owns problem CRUD. Reuses ContestService (ownership + contest DTO),
 * ContestPerformanceService (recompute on every mutation) and
 * ContestTimelineService. Contest-specific logic stays isolated here.
 */
export const contestWorkspaceService = {
  async getWorkspace(userId: string, contestId: string): Promise<ContestWorkspaceDTO> {
    const contest = await contestService.getById(userId, contestId); // ownership + DTO
    const start = new Date(contest.startTime);
    const [problemDocs, performance, timeline] = await Promise.all([
      contestProblemRepository.findByContest(userId, contestId),
      contestPerformanceService.get(userId, contestId, contest.durationMinutes),
      contestTimelineService.list(userId, contestId, start),
    ]);
    const problems = problemDocs.map(toProblemDTO);
    return {
      contest,
      problems,
      performance,
      timeline,
      statistics: statistics(problems, performance.averageSolveTime, contest.durationMinutes),
      notes: contest.notes,
    };
  },

  async getProblems(userId: string, contestId: string): Promise<ContestProblemDTO[]> {
    await requireOwnedContest(userId, contestId);
    const docs = await contestProblemRepository.findByContest(userId, contestId);
    return docs.map(toProblemDTO);
  },

  async addProblem(userId: string, contestId: string, body: CreateProblemBody): Promise<ContestProblemDTO> {
    await requireOwnedContest(userId, contestId);
    const existing = await contestProblemRepository.findByCode(userId, contestId, body.problemCode);
    if (existing) throw new ApiError(409, `Problem '${body.problemCode}' already exists in this contest`);

    const doc = await contestProblemRepository.create({
      contestRef: new Types.ObjectId(contestId),
      userId,
      problemCode: body.problemCode,
      problemName: body.problemName,
      platformProblemId: body.platformProblemId ?? '',
      url: body.url ?? '',
      index: body.index ?? '',
      difficulty: body.difficulty ?? '',
      tags: body.tags ?? [],
      solved: body.solved,
      skipped: body.skipped,
      attempted: body.attempted || body.attempts > 0 || body.solved,
      attempts: body.attempts,
      firstAttemptAt: body.firstAttemptAt ? new Date(body.firstAttemptAt) : null,
      solvedAt: body.solvedAt ? new Date(body.solvedAt) : body.solved ? new Date() : null,
      totalTimeSpent: body.totalTimeSpent,
      penalty: body.penalty,
    });
    await contestPerformanceService.recalculate(userId, contestId);
    if (doc.solved) await this.recordSolved(userId, contestId, doc);
    return toProblemDTO(doc);
  },

  async updateProblem(userId: string, problemId: string, body: UpdateProblemBody): Promise<ContestProblemDTO> {
    const doc = await requireOwnedProblem(userId, problemId);
    const wasSolved = doc.solved;
    const patch: Partial<IContestProblem> = { ...body } as Partial<IContestProblem>;
    if (body.firstAttemptAt !== undefined) patch.firstAttemptAt = body.firstAttemptAt ? new Date(body.firstAttemptAt) : null;
    if (body.solvedAt !== undefined) patch.solvedAt = body.solvedAt ? new Date(body.solvedAt) : null;
    if (body.solved === true && !doc.solvedAt && body.solvedAt === undefined) patch.solvedAt = new Date();
    if ((body.attempts ?? doc.attempts) > 0 || body.solved) patch.attempted = true;

    const updated = (await contestProblemRepository.updateById(problemId, patch)) as ContestProblemDocument;
    await contestPerformanceService.recalculate(userId, String(updated.contestRef));
    if (!wasSolved && updated.solved) await this.recordSolved(userId, String(updated.contestRef), updated);
    return toProblemDTO(updated);
  },

  async removeProblem(userId: string, problemId: string): Promise<void> {
    const doc = await requireOwnedProblem(userId, problemId);
    await contestProblemRepository.deleteById(problemId);
    await contestPerformanceService.recalculate(userId, String(doc.contestRef));
  },

  async getPerformance(userId: string, contestId: string) {
    const contest = await contestService.getById(userId, contestId);
    return contestPerformanceService.get(userId, contestId, contest.durationMinutes);
  },

  async getTimeline(userId: string, contestId: string): Promise<ContestTimelineEventDTO[]> {
    const contest = await contestService.getById(userId, contestId);
    return contestTimelineService.list(userId, contestId, new Date(contest.startTime));
  },

  async addTimelineEvent(userId: string, contestId: string, body: CreateTimelineEventBody): Promise<ContestTimelineEventDTO> {
    const contest = await requireOwnedContest(userId, contestId);
    const event = await contestTimelineService.createEvent(userId, contestId, body);
    if (body.eventType === 'contest-started') {
      await activityService.record(userId, { type: 'contest-started', entityType: 'contest', entityId: contestId, title: `Started ${contest.contestName}`, description: contest.platform });
    } else if (body.eventType === 'contest-finished') {
      await activityService.record(userId, { type: 'contest-finished', entityType: 'contest', entityId: contestId, title: `Finished ${contest.contestName}`, description: contest.platform });
    }
    return contestTimelineService.toDTO(event, contest.startTime);
  },

  async recordSolved(userId: string, contestId: string, problem: ContestProblemDocument): Promise<void> {
    await activityService.record(userId, {
      type: 'contest-problem-solved',
      entityType: 'contest',
      entityId: contestId,
      title: `Solved ${problem.index || problem.problemCode} during contest`,
      description: problem.problemName,
    });
  },
};
