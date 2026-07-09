/**
 * Learning-health tuning — thresholds + weights for the dashboard's health
 * indicators. All numbers live here (never hardcoded in the service) so the
 * health model can be retuned in one place, consistent with the rest of the app.
 */

/** Health-status bands on a 0–100 health score. */
export const HEALTH_STATUS_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40, // below this → 'at-risk'
} as const;

/**
 * Weights for the composite overall-health score (sum to 1). Retention and
 * revision are weighted highest — they're the freshest signal of what's sticking.
 */
export const HEALTH_WEIGHTS = {
  learning: 0.25,
  knowledge: 0.2,
  revision: 0.25,
  retention: 0.3,
} as const;

/** Revision-health penalty per overdue review (capped), on a 100 base. */
export const REVISION_HEALTH = {
  overduePenaltyPerReview: 8,
  maxOverduePenalty: 60,
} as const;

/** Retention-health penalty per at-risk entity (capped), applied to avg retention. */
export const RETENTION_HEALTH = {
  atRiskPenaltyPerEntity: 5,
  maxAtRiskPenalty: 30,
} as const;
