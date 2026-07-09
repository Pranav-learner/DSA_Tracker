import { analyticsAggregationService } from '../../analytics/services/analyticsAggregation.service.js';
import { patternIntelligenceService } from '../../analytics/services/patternIntelligence.service.js';
import { contestService } from './contest.service.js';
import { readinessRepository } from '../repositories/readiness.repository.js';
import { resolveAnalyticsWindow } from '../../analytics/validators/analytics.validator.js';
import {
  READINESS_WEIGHTS,
  READINESS_NORMALISERS,
  READINESS_STATUS_THRESHOLDS,
} from '../../config/competitive.js';
import type { AnalyticsOverviewDTO } from '../../analytics/dto/analytics.dto.js';
import type { ContestReadinessDTO, ReadinessProfileDTO, ReadinessStatus } from '../dto/competitive.dto.js';

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const round = (n: number) => Math.round(n);
const norm = (v: number, max: number) => clamp((v / max) * 100);

export function readinessStatus(score: number): ReadinessStatus {
  if (score >= READINESS_STATUS_THRESHOLDS.ready) return 'ready';
  if (score >= READINESS_STATUS_THRESHOLDS.developing) return 'developing';
  if (score >= READINESS_STATUS_THRESHOLDS.early) return 'early';
  return 'not-ready';
}

const LABELS: Record<string, string> = {
  pattern: 'Pattern Readiness',
  implementation: 'Implementation Readiness',
  revision: 'Revision Readiness',
  knowledge: 'Knowledge Coverage',
  recentPractice: 'Recent Practice',
  contestFrequency: 'Contest Frequency',
};

/** The six readiness sub-scores, computed from existing analytics + patterns. */
export function computeSubScores(
  overview: AnalyticsOverviewDTO,
  avgPatternMastery: number,
  contestsPerMonth: number,
): Record<keyof typeof READINESS_WEIGHTS, number> {
  const N = READINESS_NORMALISERS;
  const speedScore = clamp(100 - overview.problems.averageSolveTimeMinutes * 2);
  return {
    pattern: round(avgPatternMastery || overview.learning.averageMastery),
    implementation: round((overview.problems.successRate + speedScore) / 2),
    revision: round(overview.revision.revisionConsistencyPercent),
    knowledge: round(overview.knowledge.coveragePercent),
    recentPractice: round(norm(overview.activity.totalActivities, N.recentSolvesMax)),
    contestFrequency: round(norm(contestsPerMonth, N.contestsPerMonthMax)),
  };
}

/**
 * ContestReadinessService — the weighted contest-readiness score. Pure
 * ORCHESTRATION: every sub-score is a reused analytics/pattern/contest metric,
 * blended with configurable weights (config/competitive.ts). Persists a
 * ReadinessProfile (interview/HFT tracks are architecture placeholders).
 */
export const contestReadinessService = {
  async compute(userId: string): Promise<ContestReadinessDTO> {
    const window = resolveAnalyticsWindow({ range: '30d' });
    const [overview, patterns, stats] = await Promise.all([
      analyticsAggregationService.overview(userId, window),
      patternIntelligenceService.patterns(userId, window),
      contestService.stats(userId),
    ]);

    const avgPatternMastery = patterns.length ? patterns.reduce((s, p) => s + p.overall, 0) / patterns.length : 0;
    const sub = computeSubScores(overview, avgPatternMastery, stats.participationFrequencyPerMonth);

    const overall = round(
      (Object.keys(READINESS_WEIGHTS) as (keyof typeof READINESS_WEIGHTS)[]).reduce(
        (acc, k) => acc + sub[k] * READINESS_WEIGHTS[k],
        0,
      ),
    );

    const breakdown = (Object.keys(sub) as (keyof typeof sub)[]).map((k) => ({
      key: k,
      label: LABELS[k],
      score: sub[k],
      status: readinessStatus(sub[k]),
    }));

    // Persist the readiness profile (contest computed; interview/HFT placeholders).
    await readinessRepository.upsert(userId, {
      contestReadiness: overall,
      interviewReadiness: round((sub.pattern + sub.implementation + sub.knowledge) / 3),
      hftReadiness: round(overall * 0.7),
      breakdown: sub,
    });

    return {
      overall,
      status: readinessStatus(overall),
      breakdown,
      strongAreas: breakdown.filter((b) => b.score >= 70).map((b) => b.label),
      weakAreas: breakdown.filter((b) => b.score < 50).map((b) => b.label),
    };
  },

  /** The persisted readiness profile (all tracks). */
  async getProfile(userId: string): Promise<ReadinessProfileDTO> {
    let doc = await readinessRepository.findByUser(userId);
    if (!doc) {
      await this.compute(userId);
      doc = await readinessRepository.findByUser(userId);
    }
    return {
      contestReadiness: doc?.contestReadiness ?? 0,
      interviewReadiness: doc?.interviewReadiness ?? 0,
      hftReadiness: doc?.hftReadiness ?? 0,
      breakdown: doc?.breakdown ?? { pattern: 0, implementation: 0, revision: 0, knowledge: 0, recentPractice: 0, contestFrequency: 0 },
    };
  },
};
