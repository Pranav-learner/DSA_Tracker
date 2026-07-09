import { revisionQueueService } from '../../services/revisionQueue.service.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { metricsEngine } from './metricsEngine.js';
import { ANALYTICS_WINDOWS } from '../../config/analytics.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type { RevisionSummaryDTO } from '../dto/analytics.dto.js';

/**
 * RevisionAnalyticsService — revision-engine metrics. Reuses the queue summary
 * (overdue / scheduled) and aggregates completed sessions for frequency,
 * duration and consistency within the window.
 */
export const revisionAnalyticsService = {
  async summary(userId: string, window: AnalyticsWindow): Promise<RevisionSummaryDTO> {
    const [queue, sessions] = await Promise.all([
      revisionQueueService.getDashboardSummary(userId),
      analyticsRepository.sessionStats(userId, window.from),
    ]);

    return {
      reviewsCompleted: sessions.completed,
      overdueReviews: queue.overdueCount,
      totalScheduled: queue.totalScheduled,
      reviewFrequencyPerWeek: metricsEngine.velocity(sessions.completed, window.days, ANALYTICS_WINDOWS.frequencyDays),
      averageReviewDurationMinutes: sessions.averageDuration,
      revisionConsistencyPercent: metricsEngine.consistency(sessions.activeDays, window.days),
    };
  },
};
