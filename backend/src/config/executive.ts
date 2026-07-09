/**
 * Executive scoring tuning — the configurable weights behind the composite
 * executive scores. Each score is a weighted blend of EXISTING analytics metrics
 * (no new aggregation); this file is the single place to retune the model.
 */

/** Sub-metric weights within each score (each group sums to 1). */
export const EXECUTIVE_SCORE_WEIGHTS = {
  learning: { completion: 0.4, mastery: 0.4, velocity: 0.2 },
  knowledge: { coverage: 0.45, confidence: 0.35, documentation: 0.2 },
  retention: { retention: 0.6, health: 0.4 },
  revision: { consistency: 0.6, completion: 0.4 },
  productivity: { streak: 0.35, activeDays: 0.3, velocity: 0.35 },
} as const;

/** Weights for the Overall Readiness score (blend of the five, sums to 1). */
export const OVERALL_READINESS_WEIGHTS = {
  learning: 0.28,
  knowledge: 0.18,
  retention: 0.24,
  revision: 0.18,
  productivity: 0.12,
} as const;

/** Normalisation caps — raw counts map to 0–100 against these "great" targets. */
export const EXECUTIVE_NORMALISERS = {
  velocityPerWeekMax: 5, // topics/week that reads as 100
  streakDaysMax: 14, // a two-week streak reads as 100
  activeDaysMax: 20, // active days in a 30-day window that reads as 100
} as const;

/** Health-status bands for a 0–100 score (shared by executive breakdown). */
export const SCORE_STATUS_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
} as const;
