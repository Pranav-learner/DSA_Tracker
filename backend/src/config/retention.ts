/**
 * Central, configurable tuning for the Retention Engine. All thresholds, decay
 * parameters and weights live here (never hardcoded in services/strategies), so
 * the whole model can be retuned in one place and future strategies (AI) can
 * read/override them.
 */

/** Retention-level score thresholds (on the 0–100 retention score). */
export const RETENTION_LEVEL_THRESHOLDS = {
  mastered: 90,
  strong: 75,
  familiar: 50,
  needsReview: 60, // below this (and reviewed) → Needs Review
  atRisk: 40, // below this → At Risk
} as const;

/** How many days overdue before an entity is flagged At Risk regardless of score. */
export const AT_RISK_OVERDUE_DAYS = 7;

/** Confidence engine tuning. */
export const CONFIDENCE_CONFIG = {
  reviewBoost: 12, // confidence gained on a successful review
  selfWeight: 0.5, // blend weight for the learner's self-rating
  trendDelta: 3, // ± change to count as rising / falling
  default: 50, // starting confidence for a fresh profile
} as const;

/** Decay strategy tuning. */
export const DECAY_CONFIG = {
  baseDailyDecay: 2.0, // confidence points lost per day at review count 0
  reviewDamping: 0.35, // each prior review slows decay (higher = slower)
  minDailyDecay: 0.3, // never decays slower than this
} as const;

/** Retention score = weighted blend of confidence + review success (weights sum to 1). */
export const RETENTION_WEIGHTS = {
  confidence: 0.6,
  success: 0.4,
} as const;

/** Cap on the per-profile confidence/retention history array. */
export const RETENTION_HISTORY_LIMIT = 30;

/** Background decay job cadence (ms) + toggle, overridable via env. */
export const RETENTION_JOB = {
  intervalMs: Number(process.env.RETENTION_JOB_INTERVAL_MS ?? 6 * 60 * 60 * 1000),
  enabled: (process.env.RETENTION_JOB_ENABLED ?? 'true') !== 'false',
} as const;
