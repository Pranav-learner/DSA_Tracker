import { analyticsAggregationService } from './analyticsAggregation.service.js';
import { TREND_STABLE_DELTA } from '../../config/insights.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type { AnalyticsOverviewDTO } from '../dto/analytics.dto.js';
import type { TrendDTO, TrendDirection } from '../dto/intelligence.dto.js';

const DAY_MS = 86_400_000;

function directionOf(delta: number): TrendDirection {
  if (delta > TREND_STABLE_DELTA) return 'increasing';
  if (delta < -TREND_STABLE_DELTA) return 'declining';
  return 'stable';
}

/**
 * TrendAnalysisService — direction of each headline metric by comparing the
 * current analytics window with the immediately-preceding one. Reuses
 * AnalyticsAggregationService (both windows are cached); introduces no new
 * aggregation and no AI.
 */
export const trendAnalysisService = {
  /** The equal-length window immediately before the current one. */
  previousWindow(current: AnalyticsWindow): AnalyticsWindow {
    const days = current.days ?? 30;
    const curTo = current.to;
    const curFrom = current.from ?? new Date(curTo.getTime() - days * DAY_MS);
    return { from: new Date(curFrom.getTime() - days * DAY_MS), to: curFrom, label: 'custom', days };
  },

  async analyze(userId: string, window: AnalyticsWindow, current?: AnalyticsOverviewDTO): Promise<TrendDTO[]> {
    const [cur, prev] = await Promise.all([
      current ? Promise.resolve(current) : analyticsAggregationService.overview(userId, window),
      analyticsAggregationService.overview(userId, this.previousWindow(window)),
    ]);

    const rows: { key: string; label: string; unit: string; cur: number; prev: number }[] = [
      { key: 'confidence', label: 'Confidence', unit: '%', cur: cur.retention.averageConfidence, prev: prev.retention.averageConfidence },
      { key: 'retention', label: 'Retention', unit: '%', cur: cur.retention.averageRetention, prev: prev.retention.averageRetention },
      { key: 'mastery', label: 'Mastery', unit: '%', cur: cur.learning.averageMastery, prev: prev.learning.averageMastery },
      { key: 'velocity', label: 'Learning Velocity', unit: '/wk', cur: cur.learning.learningVelocityPerWeek, prev: prev.learning.learningVelocityPerWeek },
      { key: 'revisionConsistency', label: 'Revision Consistency', unit: '%', cur: cur.revision.revisionConsistencyPercent, prev: prev.revision.revisionConsistencyPercent },
      { key: 'knowledge', label: 'Knowledge Growth', unit: '', cur: cur.knowledge.notebookEntries, prev: prev.knowledge.notebookEntries },
      { key: 'attemptSuccess', label: 'Attempt Success', unit: '%', cur: cur.problems.successRate, prev: prev.problems.successRate },
      { key: 'difficultyProgression', label: 'Problems Solved', unit: '', cur: cur.problems.solvedProblems, prev: prev.problems.solvedProblems },
    ];

    return rows.map((r) => {
      const delta = Math.round((r.cur - r.prev) * 10) / 10;
      return { key: r.key, label: r.label, current: r.cur, previous: r.prev, delta, direction: directionOf(delta), unit: r.unit };
    });
  },
};
