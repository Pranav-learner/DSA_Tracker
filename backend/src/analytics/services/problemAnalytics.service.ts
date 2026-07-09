import { problemRepository } from '../../repositories/problem.repository.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { metricsEngine } from './metricsEngine.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type { DistributionSliceDTO, ProblemSummaryDTO } from '../dto/analytics.dto.js';

function withPercent<K extends string>(
  slices: { key: K; count: number }[],
  total: number,
): DistributionSliceDTO<K>[] {
  return slices.map((s) => ({ key: s.key, count: s.count, percent: metricsEngine.percentage(s.count, total) }));
}

/**
 * ProblemAnalyticsService — attempt-engine metrics. Reuses the ProblemRepository
 * count + the analytics aggregation of UserProblem/Problem for solved/attempted
 * counts, solve time and platform/difficulty distributions.
 */
export const problemAnalyticsService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async summary(userId: string, _window: AnalyticsWindow): Promise<ProblemSummaryDTO> {
    const [totalProblems, stats] = await Promise.all([
      problemRepository.countAll(),
      analyticsRepository.problemStats(userId),
    ]);

    return {
      totalProblems,
      solvedProblems: stats.solved,
      attemptedProblems: stats.attempted,
      successRate: metricsEngine.successRate(stats.solved, stats.attempted),
      averageSolveTimeMinutes: stats.solved > 0 ? metricsEngine.round(stats.solvedTime / stats.solved) : 0,
      platformDistribution: withPercent(stats.byPlatform, stats.solved),
      difficultyDistribution: withPercent(stats.byDifficulty, stats.solved),
    };
  },
};
