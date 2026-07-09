import { contestProblemRepository } from '../repositories/contestProblem.repository.js';
import { contestPerformanceRepository } from '../repositories/contestPerformance.repository.js';
import type { ContestProblemDocument } from '../../models/ContestProblem.js';
import type { ContestPerformanceDocument } from '../../models/ContestPerformance.js';
import type { ContestPerformanceDTO } from '../dto/workspace.dto.js';

const round = (n: number) => Math.round(n);

function isAttempted(p: ContestProblemDocument): boolean {
  return p.attempted || p.attempts > 0 || p.solved;
}

/** Wrong submissions on a problem = all attempts minus the (single) accepted one. */
function wrongOf(p: ContestProblemDocument): number {
  return Math.max(0, p.attempts - (p.solved ? 1 : 0));
}

/**
 * ContestPerformanceService — the ONLY place contest performance is computed.
 * Aggregates the contest's ContestProblem docs into a cached ContestPerformance
 * record (recomputed on every problem mutation), and derives the workspace DTO.
 */
export const contestPerformanceService = {
  /** Recompute + persist the performance record from the contest's problems. */
  async recalculate(userId: string, contestRef: string): Promise<ContestPerformanceDocument | null> {
    const problems = await contestProblemRepository.findByContest(userId, contestRef);

    const solved = problems.filter((p) => p.solved);
    const solveTimes = solved.map((p) => p.totalTimeSpent).filter((t) => t > 0);

    const totalSolved = solved.length;
    const totalAttempts = problems.reduce((s, p) => s + p.attempts, 0);
    const wrongAttempts = problems.reduce((s, p) => s + wrongOf(p), 0);
    const penalty = solved.reduce((s, p) => s + (p.penalty ?? 0), 0);
    const averageSolveTime = solveTimes.length ? round(solveTimes.reduce((a, b) => a + b, 0) / solveTimes.length) : 0;

    return contestPerformanceRepository.upsert(userId, contestRef, {
      totalSolved,
      totalAttempts,
      wrongAttempts,
      penalty,
      averageSolveTime,
      fastestSolve: solveTimes.length ? Math.min(...solveTimes) : null,
      slowestSolve: solveTimes.length ? Math.max(...solveTimes) : null,
      solvedProblems: solved.map((p) => p.problemCode),
      unsolvedProblems: problems.filter((p) => !p.solved && !p.skipped && isAttempted(p)).map((p) => p.problemCode),
      skippedProblems: problems.filter((p) => p.skipped).map((p) => p.problemCode),
    });
  },

  /** Load the performance record (recomputing if it doesn't exist yet). */
  async get(userId: string, contestRef: string, contestDurationMinutes: number): Promise<ContestPerformanceDTO> {
    let doc = await contestPerformanceRepository.findByContest(userId, contestRef);
    if (!doc) doc = await this.recalculate(userId, contestRef);
    return this.toDTO(userId, contestRef, doc, contestDurationMinutes);
  },

  toDTO(
    _userId: string,
    contestRef: string,
    doc: ContestPerformanceDocument | null,
    contestDurationMinutes: number,
  ): ContestPerformanceDTO {
    const totalProblems =
      (doc?.solvedProblems.length ?? 0) + (doc?.unsolvedProblems.length ?? 0) + (doc?.skippedProblems.length ?? 0);
    const problemSuccessRate = totalProblems ? round(((doc?.totalSolved ?? 0) / totalProblems) * 100) : 0;
    return {
      contestRef,
      totalSolved: doc?.totalSolved ?? 0,
      totalAttempts: doc?.totalAttempts ?? 0,
      wrongAttempts: doc?.wrongAttempts ?? 0,
      penalty: doc?.penalty ?? 0,
      averageSolveTime: doc?.averageSolveTime ?? 0,
      fastestSolve: doc?.fastestSolve ?? null,
      slowestSolve: doc?.slowestSolve ?? null,
      contestDurationMinutes,
      problemSuccessRate,
      solvedProblems: doc?.solvedProblems ?? [],
      unsolvedProblems: doc?.unsolvedProblems ?? [],
      skippedProblems: doc?.skippedProblems ?? [],
    };
  },

  /** Remove the cached record (on contest/workspace deletion). */
  remove(userId: string, contestRef: string): Promise<unknown> {
    return contestPerformanceRepository.deleteByContest(userId, contestRef);
  },
};
