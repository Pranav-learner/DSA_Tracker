import { retentionService } from '../../services/retention.service.js';
import { metricsEngine } from './metricsEngine.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type { RetentionSummaryDTO } from '../dto/analytics.dto.js';

/**
 * RetentionAnalyticsService — retention-engine metrics. Reuses the retention
 * overview (single source of truth) and derives a composite knowledge-health
 * read from retention + confidence.
 */
export const retentionAnalyticsService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async summary(userId: string, _window: AnalyticsWindow): Promise<RetentionSummaryDTO> {
    const ov = await retentionService.overview(userId);
    return {
      averageRetention: ov.averageRetention,
      averageConfidence: ov.averageConfidence,
      knowledgeHealthPercent: metricsEngine.average([ov.averageRetention, ov.averageConfidence]),
      atRiskTopics: ov.atRiskCount,
      masteredTopics: ov.masteredCount,
      needsReviewTopics: ov.needsReviewCount,
      totalTracked: ov.totalProfiles,
    };
  },
};
