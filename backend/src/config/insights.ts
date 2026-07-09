/**
 * Pattern-Intelligence tuning — every threshold and weight the rule-based
 * Insight / Weakness / Strength / Trend engines use. Nothing is hardcoded in the
 * services; the whole intelligence model is retuned here (env-overridable),
 * consistent with the retention/analytics config.
 */

/** Weakness thresholds — a signal fires when a metric is at/beyond the bound. */
export const WEAKNESS_THRESHOLDS = {
  lowMastery: 50, // topic mastery below this → weak topic
  lowConfidence: 55, // pattern confidence below this → confidence gap
  lowRetention: 50, // retention below this → at-risk knowledge
  highHintDependency: 40, // % of solved problems that needed a hint
  highEditorialDependency: 30, // % of solved problems that needed the editorial
  slowSolveTimeMinutes: 45, // average solve time above this → slow area
  lowSuccessRate: 50, // attempt success below this → high failure rate
  lowRevisionSuccess: 55, // per-pattern revision success below this
  repeatedMistakeAttempts: 4, // attempted ≥ this many times, still unsolved
} as const;

/** Strength thresholds — a positive signal fires when a metric is at/above. */
export const STRENGTH_THRESHOLDS = {
  strongMastery: 80,
  highConfidence: 80,
  excellentRetention: 80,
  fastSolveTimeMinutes: 15,
  highRevisionSuccess: 80,
  recentImprovementDelta: 8, // +Δ over the window counts as "recently improved"
} as const;

/** Severity bands, expressed as how far past a threshold a signal sits (points). */
export const SEVERITY_BANDS = {
  high: 20, // ≥ 20 points past the threshold
  medium: 10, // ≥ 10 points past
  // else → low
} as const;

/** Trend direction band — |Δ| within this is "stable", else rising/declining. */
export const TREND_STABLE_DELTA = 3;

/** How a pattern's overall status is derived from its matrix overall score. */
export const PATTERN_STATUS_THRESHOLDS = {
  strong: 75,
  developing: 50, // below → needs-work
} as const;

/**
 * Matrix dimension → mastery-metric mapping. The Pattern Confidence Matrix is a
 * presentation of the existing eight mastery metrics (+ retention); this records
 * exactly which metric backs each dimension so there's a single source of truth.
 * `contestReadiness` is a placeholder this sprint (backed by the contest metric).
 */
export const MATRIX_METRIC_MAP = {
  understanding: 'standard',
  recognition: 'recognition',
  implementation: 'implementation',
  optimization: 'mixed',
  contestReadiness: 'contest',
  confidence: 'confidence',
} as const;

/** Insight feed limits + recommendation caps. */
export const INSIGHT_LIMITS = {
  maxInsights: 30,
  maxRecommendations: 12,
  maxActivityEmit: 4, // background job emits at most this many insight activities/run
} as const;
