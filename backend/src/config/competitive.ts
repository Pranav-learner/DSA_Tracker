/**
 * Competitive-intelligence tuning — the configurable weights, thresholds and
 * normalisers behind the readiness score and the rule-based correlations. All
 * numbers live here (never hardcoded in services), so the whole competitive
 * model can be retuned in one place. No statistics/ML — pure configurable rules.
 */

/** Sub-score weights for the overall contest-readiness score (sum to 1). */
export const READINESS_WEIGHTS = {
  pattern: 0.24,
  implementation: 0.18,
  revision: 0.16,
  knowledge: 0.16,
  recentPractice: 0.14,
  contestFrequency: 0.12,
} as const;

/** Raw counts → 0–100 against these "great" targets. */
export const READINESS_NORMALISERS = {
  contestsPerMonthMax: 6, // 6 contests/month reads as 100
  recentSolvesMax: 40, // solved problems (window) that reads as 100
} as const;

/** Readiness / score status bands on a 0–100 score. */
export const READINESS_STATUS_THRESHOLDS = {
  ready: 80,
  developing: 60,
  early: 40,
} as const;

/**
 * Correlation thresholds — a metric is "high" at/above `high`, "low" below
 * `low`. Direction/strength are derived from where the two metrics sit, purely
 * by rule (no regression).
 */
export const CORRELATION_THRESHOLDS = {
  high: 60,
  low: 40,
} as const;

/** Insight thresholds — when a competitive insight fires. */
export const COMPETITIVE_INSIGHT_THRESHOLDS = {
  slowSolveMinutes: 40,
  highEditorialDependency: 30,
  lowRevisionConsistency: 55,
  ratingDropForWarning: -20,
  recentImprovementDelta: 8,
} as const;

/** A rating change at/beyond this magnitude is a milestone. */
export const RATING_MILESTONE_DELTA = 50;

/** Cap on generated insights / recommendations. */
export const COMPETITIVE_LIMITS = {
  maxInsights: 20,
  maxRecommendations: 10,
} as const;
