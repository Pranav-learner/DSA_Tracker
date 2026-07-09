import { ANALYTICS_WINDOWS } from '../../config/analytics.js';

/**
 * MetricsEngine — the single home for reusable metric math. Every analytics
 * service composes these pure functions instead of re-deriving percentages,
 * rates, averages, velocity or growth, so a metric is defined exactly once.
 *
 * All functions are pure, null-safe and clamp/round sensibly for display.
 */
export const metricsEngine = {
  round(n: number, dp = 0): number {
    const f = 10 ** dp;
    return Math.round(n * f) / f;
  },

  clampPercent(n: number): number {
    return Math.max(0, Math.min(100, n));
  },

  /** part / total as a 0–100 percentage (0 when total is 0). */
  percentage(part: number, total: number, dp = 0): number {
    if (total <= 0) return 0;
    return this.round(this.clampPercent((part / total) * 100), dp);
  },

  /** Success rate = successes / attempts, as a 0–100 percentage. */
  successRate(successes: number, attempts: number, dp = 0): number {
    return this.percentage(successes, attempts, dp);
  },

  /** Arithmetic mean of a list (0 for empty). */
  average(values: number[], dp = 0): number {
    if (values.length === 0) return 0;
    return this.round(values.reduce((a, b) => a + b, 0) / values.length, dp);
  },

  /** Weighted mean over {value, weight} pairs (0 when total weight is 0). */
  weightedAverage(pairs: { value: number; weight: number }[], dp = 0): number {
    const totalWeight = pairs.reduce((s, p) => s + p.weight, 0);
    if (totalWeight <= 0) return 0;
    const sum = pairs.reduce((s, p) => s + p.value * p.weight, 0);
    return this.round(sum / totalWeight, dp);
  },

  /**
   * Rate of `count` events normalised to a window (default: per week). E.g.
   * 10 reviews over 30 days → ~2.33 per week.
   */
  velocity(count: number, windowDays: number | null, perDays = ANALYTICS_WINDOWS.velocityDays, dp = 1): number {
    const days = windowDays && windowDays > 0 ? windowDays : perDays;
    return this.round((count / days) * perDays, dp);
  },

  /** Growth rate (%) from a previous to a current value. */
  growthRate(current: number, previous: number, dp = 0): number {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return this.round(((current - previous) / previous) * 100, dp);
  },

  /**
   * Consistency (%) — how many of the last `windowDays` had ≥1 event, given the
   * set of active day-keys. A simple, explainable regularity measure.
   */
  consistency(activeDays: number, windowDays: number | null, dp = 0): number {
    if (!windowDays || windowDays <= 0) return activeDays > 0 ? 100 : 0;
    return this.percentage(Math.min(activeDays, windowDays), windowDays, dp);
  },
};
