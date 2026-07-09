import { progressService } from '../../services/progress.service.js';
import { phaseService } from '../../services/phase.service.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { metricsEngine } from './metricsEngine.js';
import type { AnalyticsContext, AnalyticsWindow } from '../types/analytics.types.js';
import type { LearningSummaryDTO } from '../dto/analytics.dto.js';

/**
 * LearningAnalyticsService — learning-engine metrics. Reuses ProgressService for
 * the mastery/completion truth and adds the time-based figures (velocity,
 * learning time) via the analytics repository + MetricsEngine.
 */
export const learningAnalyticsService = {
  async summary(userId: string, window: AnalyticsWindow, ctx: AnalyticsContext = {}): Promise<LearningSummaryDTO> {
    const [overview, phases, completedInWindow] = await Promise.all([
      ctx.overview ? Promise.resolve(ctx.overview) : progressService.getOverview(userId),
      phaseService.list(),
      analyticsRepository.topicsCompletedSince(userId, window.from),
    ]);

    const titleById = new Map(phases.map((p) => [p.id, p.title]));
    const learningTimeHours = metricsEngine.round(
      overview.phases.reduce((s, p) => s + p.estimatedTimeSpentHours, 0),
    );

    return {
      topicsCompleted: overview.overall.topicsCompleted,
      topicsRemaining: overview.overall.topicsRemaining,
      topicsTotal: overview.overall.topicsTotal,
      phasesCompleted: overview.overall.phasesCompleted,
      phasesTotal: overview.overall.phasesTotal,
      completionPercent: overview.overall.completionPercent,
      averageMastery: overview.overall.averageTopicMastery,
      averageConfidence: overview.overall.averageConfidence,
      learningVelocityPerWeek: metricsEngine.velocity(completedInWindow, window.days),
      learningTimeHours,
      phaseProgress: overview.phases.map((p) => ({
        phaseId: p.phaseId,
        title: titleById.get(p.phaseId) ?? '',
        completionPercent: p.completionPercent,
        mastery: p.mastery,
        topicsCompleted: p.topicsCompleted,
        topicsTotal: p.topicsTotal,
      })),
    };
  },
};
