import { attemptRepository } from '../repositories/attempt.repository.js';
import { userProblemRepository } from '../repositories/userProblem.repository.js';
import { problemRepository } from '../repositories/problem.repository.js';
import { attemptIntegration } from './attemptIntegration.js';
import { ApiError } from '../utils/ApiError.js';
import type { AttemptDocument, IAttempt } from '../models/Attempt.js';
import type { ProblemDocument } from '../models/Problem.js';
import type { ProblemStatus } from '../types/domain.js';
import type { CreateAttemptBody, UpdateAttemptBody } from '../validators/attempt.validator.js';
import type { AttemptDTO, AttemptSummaryDTO } from './attempt.dto.js';

const round = (n: number) => Math.round(n);
const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

/**
 * AttemptService — the sole home of attempt business logic. It creates/updates/
 * completes/soft-deletes attempts, keeps `UserProblem` synchronised (recomputed
 * from the immutable history, never hand-set) and fires cross-module integration
 * via `attemptIntegration`. Repositories do the DB work; this does the reasoning.
 */
export const attemptService = {
  async create(userId: string, body: CreateAttemptBody): Promise<AttemptDTO> {
    const problem = await requireProblem(body.problemId);
    ensureTimeOrder(body.startTime, body.endTime ?? null);

    const attemptNumber = (await attemptRepository.maxAttemptNumber(userId, body.problemId)) + 1;
    const durationMinutes = resolveDuration(body.startTime, body.endTime ?? null, body.durationMinutes);

    const doc = await attemptRepository.create({
      userId,
      problemId: problem._id,
      attemptNumber,
      status: body.status,
      verdict: body.verdict,
      language: body.language,
      startTime: body.startTime,
      endTime: body.endTime ?? null,
      durationMinutes,
      wrongAttempts: body.wrongAttempts ?? 0,
      usedHint: body.usedHint ?? false,
      usedEditorial: body.usedEditorial ?? false,
      contestAttempt: body.contestAttempt ?? false,
      upsolved: body.upsolved ?? false,
      notes: body.notes ?? '',
      deletedAt: null,
    });

    // Detect the problem's FIRST solve (not attempt-level) so the learning
    // integration fires exactly once per problem.
    const beforeSolved = (await userProblemRepository.findByUserAndProblem(userId, body.problemId))?.solved ?? false;
    const { solved: afterSolved } = await this.syncUserProblem(userId, body.problemId);
    const firstSolve = !beforeSolved && afterSolved;

    await attemptIntegration.onAttemptCreated(userId, { problem, attempt: doc, firstSolve });
    return toAttemptDTO(doc);
  },

  /**
   * Update an attempt. Also handles "completion" — a PATCH that moves status to
   * Solved/Abandoned is the completion path (no separate endpoint needed).
   */
  async update(userId: string, attemptId: string, body: UpdateAttemptBody): Promise<AttemptDTO> {
    const existing = await requireOwnedAttempt(userId, attemptId);

    const startTime = body.startTime ?? existing.startTime;
    const endTime = body.endTime !== undefined ? body.endTime : existing.endTime;
    ensureTimeOrder(startTime, endTime);

    const timesChanged = body.startTime !== undefined || body.endTime !== undefined;
    const durationMinutes =
      body.durationMinutes !== undefined
        ? body.durationMinutes
        : timesChanged
          ? resolveDuration(startTime, endTime, undefined)
          : existing.durationMinutes;

    const patch: Partial<IAttempt> = {
      startTime,
      endTime,
      durationMinutes,
      ...definedOnly({
        status: body.status,
        verdict: body.verdict,
        language: body.language,
        wrongAttempts: body.wrongAttempts,
        usedHint: body.usedHint,
        usedEditorial: body.usedEditorial,
        contestAttempt: body.contestAttempt,
        upsolved: body.upsolved,
        notes: body.notes,
      }),
    };

    const problemId = String(existing.problemId);
    const beforeSolved = (await userProblemRepository.findByUserAndProblem(userId, problemId))?.solved ?? false;

    const updated = await attemptRepository.updateById(attemptId, patch);
    if (!updated) throw ApiError.notFound(`Attempt '${attemptId}' not found`);

    const { solved: afterSolved } = await this.syncUserProblem(userId, problemId);
    const firstSolve = !beforeSolved && afterSolved;

    const problem = await requireProblem(problemId);
    await attemptIntegration.onAttemptUpdated(userId, { problem, attempt: updated, firstSolve });
    return toAttemptDTO(updated);
  },

  async getById(userId: string, attemptId: string): Promise<AttemptDTO> {
    return toAttemptDTO(await requireOwnedAttempt(userId, attemptId));
  },

  async history(userId: string, problemId: string): Promise<AttemptDTO[]> {
    await requireProblem(problemId);
    const attempts = await attemptRepository.findByUserAndProblem(userId, problemId);
    return attempts.map(toAttemptDTO);
  },

  async summary(userId: string, problemId: string): Promise<AttemptSummaryDTO> {
    await requireProblem(problemId);
    const attempts = await attemptRepository.findByUserAndProblem(userId, problemId);
    return buildSummary(problemId, attempts);
  },

  /** Soft-delete an attempt, then resync aggregates. Idempotent. */
  async remove(userId: string, attemptId: string): Promise<void> {
    const attempt = await requireOwnedAttempt(userId, attemptId);
    await attemptRepository.softDeleteById(attemptId, new Date());
    await this.syncUserProblem(userId, String(attempt.problemId));
  },

  /**
   * Recompute UserProblem's attempt-derived aggregates from the live history —
   * the single place these are written, so they can never drift.
   */
  async syncUserProblem(userId: string, problemId: string): Promise<{ solved: boolean }> {
    const attempts = await attemptRepository.findByUserAndProblem(userId, problemId);
    const agg = aggregate(attempts);
    const status: ProblemStatus = agg.solved
      ? 'Solved'
      : attempts.length > 0
        ? 'In Progress'
        : 'Not Started';

    await userProblemRepository.upsert(userId, problemId, {
      status,
      totalAttempts: agg.totalAttempts,
      firstSolvedAt: agg.firstSolvedAt,
      latestAttemptAt: agg.latestAttemptAt,
      totalTimeSpent: agg.totalTimeSpent,
      solved: agg.solved,
      solvedWithoutHint: agg.solvedWithoutHint,
      solvedWithoutEditorial: agg.solvedWithoutEditorial,
    });
    return { solved: agg.solved };
  },
};

/* ------------------------------- helpers -------------------------------- */

async function requireProblem(problemId: string): Promise<ProblemDocument> {
  const problem = await problemRepository.findById(problemId);
  if (!problem) throw ApiError.notFound(`Problem '${problemId}' not found`);
  return problem;
}

async function requireOwnedAttempt(userId: string, attemptId: string): Promise<AttemptDocument> {
  const attempt = await attemptRepository.findById(attemptId);
  if (!attempt || attempt.deletedAt) throw ApiError.notFound(`Attempt '${attemptId}' not found`);
  if (attempt.userId !== userId) throw new ApiError(403, 'You do not own this attempt');
  return attempt;
}

/** Duration precedence: explicit value → derived from times → 0. Never negative. */
function resolveDuration(startTime: Date, endTime: Date | null, explicit: number | undefined): number {
  if (explicit !== undefined) return Math.max(0, round(explicit));
  if (endTime) return Math.max(0, round((endTime.getTime() - startTime.getTime()) / 60_000));
  return 0;
}

function ensureTimeOrder(startTime: Date, endTime: Date | null): void {
  if (endTime && startTime.getTime() > endTime.getTime()) {
    throw ApiError.badRequest('startTime must be before endTime');
  }
}

/** Keep only defined keys (so undefined patch fields don't overwrite existing). */
function definedOnly<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k as keyof T] = v as T[keyof T];
  }
  return out;
}

interface Aggregates {
  totalAttempts: number;
  solved: boolean;
  solvedCount: number;
  firstSolvedAt: Date | null;
  latestAttemptAt: Date | null;
  totalTimeSpent: number;
  averageSolveTime: number;
  hintUsageCount: number;
  editorialUsageCount: number;
  solvedWithoutHint: boolean;
  solvedWithoutEditorial: boolean;
}

/** Pure reduction of an attempt list into the aggregates UserProblem/summary need. */
function aggregate(attempts: AttemptDocument[]): Aggregates {
  const solvedAttempts = attempts.filter((a) => a.status === 'Solved');
  const solveTimeOf = (a: AttemptDocument) => (a.endTime ?? a.createdAt);

  let firstSolvedAt: Date | null = null;
  for (const a of solvedAttempts) {
    const t = solveTimeOf(a);
    if (!firstSolvedAt || t < firstSolvedAt) firstSolvedAt = t;
  }

  // attempts arrive newest-first (createdAt desc).
  const latestAttemptAt = attempts.length ? attempts[0].createdAt : null;

  return {
    totalAttempts: attempts.length,
    solved: solvedAttempts.length > 0,
    solvedCount: solvedAttempts.length,
    firstSolvedAt,
    latestAttemptAt,
    totalTimeSpent: round(attempts.reduce((sum, a) => sum + a.durationMinutes, 0)),
    averageSolveTime: round(avg(solvedAttempts.map((a) => a.durationMinutes))),
    hintUsageCount: attempts.filter((a) => a.usedHint).length,
    editorialUsageCount: attempts.filter((a) => a.usedEditorial).length,
    solvedWithoutHint: solvedAttempts.some((a) => !a.usedHint),
    solvedWithoutEditorial: solvedAttempts.some((a) => !a.usedEditorial),
  };
}

function buildSummary(problemId: string, attempts: AttemptDocument[]): AttemptSummaryDTO {
  const agg = aggregate(attempts);
  return {
    problemId,
    totalAttempts: agg.totalAttempts,
    solved: agg.solved,
    solvedCount: agg.solvedCount,
    firstSolvedAt: agg.firstSolvedAt ? agg.firstSolvedAt.toISOString() : null,
    latestAttemptAt: agg.latestAttemptAt ? agg.latestAttemptAt.toISOString() : null,
    totalTimeSpent: agg.totalTimeSpent,
    averageSolveTime: agg.averageSolveTime,
    hintUsageCount: agg.hintUsageCount,
    editorialUsageCount: agg.editorialUsageCount,
    solvedWithoutHint: agg.solvedWithoutHint,
    solvedWithoutEditorial: agg.solvedWithoutEditorial,
    latestAttempt: attempts.length ? toAttemptDTO(attempts[0]) : null,
  };
}

function toAttemptDTO(a: AttemptDocument): AttemptDTO {
  return {
    id: String(a._id),
    userId: a.userId,
    problemId: String(a.problemId),
    attemptNumber: a.attemptNumber,
    status: a.status,
    verdict: a.verdict,
    language: a.language,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime ? a.endTime.toISOString() : null,
    durationMinutes: a.durationMinutes,
    wrongAttempts: a.wrongAttempts,
    usedHint: a.usedHint,
    usedEditorial: a.usedEditorial,
    contestAttempt: a.contestAttempt,
    upsolved: a.upsolved,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
