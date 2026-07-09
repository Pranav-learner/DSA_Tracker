import { notebookService } from '../../services/notebook.service.js';
import { progressService } from '../../services/progress.service.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { metricsEngine } from './metricsEngine.js';
import type { AnalyticsContext, AnalyticsWindow } from '../types/analytics.types.js';
import type { KnowledgeSummaryDTO } from '../dto/analytics.dto.js';

/**
 * KnowledgeAnalyticsService — knowledge-engine metrics. Reuses the Module 2
 * notebook stats + a confidence aggregation, and derives coverage/documentation
 * rate against the learning overview (topics total / completed).
 */
export const knowledgeAnalyticsService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async summary(userId: string, _window: AnalyticsWindow, ctx: AnalyticsContext = {}): Promise<KnowledgeSummaryDTO> {
    const [stats, confidence, overview] = await Promise.all([
      notebookService.stats(userId),
      analyticsRepository.notebookConfidence(userId),
      ctx.overview ? Promise.resolve(ctx.overview) : progressService.getOverview(userId),
    ]);

    return {
      notebookEntries: stats.knowledgeEntries,
      representativeProblems: stats.representativeProblems,
      patternsLearned: stats.patternsLearned,
      topicsCovered: stats.topicsCovered,
      coveragePercent: metricsEngine.percentage(stats.topicsCovered, overview.overall.topicsTotal),
      // Of the topics completed, how many carry notebook documentation.
      documentationRate: metricsEngine.percentage(stats.topicsCovered, overview.overall.topicsCompleted),
      averageConfidence: confidence.averageConfidence,
    };
  },
};
