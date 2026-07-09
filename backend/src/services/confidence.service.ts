import { CONFIDENCE_CONFIG } from '../config/retention.js';
import type { ConfidenceTrendDTO } from './retention.dto.js';
import type { IRetentionSnapshot } from '../models/RetentionProfile.js';

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * ConfidenceService — the confidence math (configurable, never hardcoded).
 * Computes post-review confidence and the confidence trend. Decay is applied by
 * the DecayStrategy; this service handles the review-driven side.
 */
export const confidenceService = {
  /** New confidence after a successful review, blending an optional self-rating. */
  boostAfterReview(current: number, selfRating: number | null): number {
    const boosted = clamp(current + CONFIDENCE_CONFIG.reviewBoost);
    if (selfRating == null) return Math.round(boosted);
    const w = CONFIDENCE_CONFIG.selfWeight;
    return Math.round(clamp(w * selfRating + (1 - w) * boosted));
  },

  /** Rising / falling / stable, with a delta and a short series for the sparkline. */
  trend(snapshots: Pick<IRetentionSnapshot, 'confidenceScore' | 'date'>[]): ConfidenceTrendDTO {
    const series = snapshots.slice(-10).map((s) => ({
      date: new Date(s.date).toISOString(),
      value: s.confidenceScore,
    }));
    if (series.length < 2) return { direction: 'stable', delta: 0, series };
    const delta = series[series.length - 1].value - series[0].value;
    const direction =
      delta > CONFIDENCE_CONFIG.trendDelta ? 'rising' : delta < -CONFIDENCE_CONFIG.trendDelta ? 'falling' : 'stable';
    return { direction, delta: Math.round(delta), series };
  },
};
