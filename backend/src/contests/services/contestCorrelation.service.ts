import { analyticsAggregationService } from '../../analytics/services/analyticsAggregation.service.js';
import { ratingAnalyticsService } from './ratingAnalytics.service.js';
import { resolveAnalyticsWindow } from '../../analytics/validators/analytics.validator.js';
import { CORRELATION_THRESHOLDS } from '../../config/competitive.js';
import type { AnalyticsOverviewDTO } from '../../analytics/dto/analytics.dto.js';
import type { RatingAnalysisDTO } from '../dto/competitive.dto.js';
import type {
  ContestCorrelationDTO,
  CorrelationDirection,
  CorrelationItemDTO,
  CorrelationStrength,
} from '../dto/competitive.dto.js';

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Rule-based correlation between two 0–100 metrics — NO statistics/ML. Aligned
 * (both high / both low) → positive; diverging → negative; else neutral. Strength
 * from the alignment gap. Thresholds are configurable.
 */
function correlate(xLabel: string, yLabel: string, xValue: number, yValue: number): { direction: CorrelationDirection; strength: CorrelationStrength; insight: string } {
  const T = CORRELATION_THRESHOLDS;
  const xHigh = xValue >= T.high;
  const yHigh = yValue >= T.high;
  const xLow = xValue < T.low;
  const yLow = yValue < T.low;
  const gap = Math.abs(xValue - yValue);
  const strength: CorrelationStrength = gap <= 10 ? 'strong' : gap <= 25 ? 'moderate' : 'weak';

  if (xHigh && yHigh) return { direction: 'positive', strength: 'strong', insight: `Strong ${xLabel.toLowerCase()} (${xValue}%) aligns with strong ${yLabel.toLowerCase()} (${yValue}%).` };
  if (xLow && yLow) return { direction: 'positive', strength, insight: `Low ${xLabel.toLowerCase()} (${xValue}%) coincides with weak ${yLabel.toLowerCase()} (${yValue}%) — lifting ${xLabel.toLowerCase()} should help.` };
  if ((xHigh && yLow) || (xLow && yHigh)) return { direction: 'negative', strength: 'moderate', insight: `${xLabel} (${xValue}%) and ${yLabel} (${yValue}%) diverge — worth investigating.` };
  return { direction: 'neutral', strength: 'weak', insight: `${xLabel} (${xValue}%) and ${yLabel} (${yValue}%) show no clear relationship yet.` };
}

/**
 * ContestCorrelationService — correlates learning behaviour with contest
 * outcomes via configurable rules over EXISTING analytics metrics. It computes
 * no new statistics and stores nothing.
 */
export const contestCorrelationService = {
  build(overview: AnalyticsOverviewDTO, rating: RatingAnalysisDTO): ContestCorrelationDTO {
    const speedScore = clamp(100 - overview.problems.averageSolveTimeMinutes * 2);
    const growthScore = clamp(50 + rating.ratingGrowth / 2);

    const pairs: Omit<CorrelationItemDTO, 'direction' | 'strength' | 'insight'>[] = [
      { key: 'confidence-success', label: 'Confidence → Contest Success', xLabel: 'Confidence', yLabel: 'Success rate', xValue: overview.retention.averageConfidence, yValue: overview.problems.successRate },
      { key: 'revision-performance', label: 'Revision → Performance', xLabel: 'Revision consistency', yLabel: 'Contest consistency', xValue: overview.revision.revisionConsistencyPercent, yValue: rating.contestConsistency },
      { key: 'knowledge-solving', label: 'Knowledge → Problem Solving', xLabel: 'Knowledge coverage', yLabel: 'Success rate', xValue: overview.knowledge.coveragePercent, yValue: overview.problems.successRate },
      { key: 'speed-rank', label: 'Solve Speed → Rank', xLabel: 'Solve speed', yLabel: 'Success rate', xValue: speedScore, yValue: overview.problems.successRate },
      { key: 'mastery-rating', label: 'Mastery → Rating Growth', xLabel: 'Mastery', yLabel: 'Rating growth', xValue: overview.learning.averageMastery, yValue: growthScore },
    ];

    return {
      items: pairs.map((p) => ({ ...p, ...correlate(p.xLabel, p.yLabel, p.xValue, p.yValue) })),
    };
  },

  async analyze(userId: string): Promise<ContestCorrelationDTO> {
    const window = resolveAnalyticsWindow({ range: '30d' });
    const [overview, rating] = await Promise.all([analyticsAggregationService.overview(userId, window), ratingAnalyticsService.analyze(userId)]);
    return this.build(overview, rating);
  },
};
