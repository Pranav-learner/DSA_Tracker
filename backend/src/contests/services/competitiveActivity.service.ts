import { competitiveIntelligenceService } from './competitiveIntelligence.service.js';
import { ratingService } from './rating.service.js';
import { activityService } from '../../services/activity.service.js';
import { activityRepository } from '../../repositories/activity.repository.js';
import { resolveAnalyticsWindow } from '../../analytics/validators/analytics.validator.js';
import { RATING_MILESTONE_DELTA } from '../../config/competitive.js';
import type { AnalyticsWindow } from '../../analytics/types/analytics.types.js';

/**
 * CompetitiveActivityService — records notable competitive-intelligence events
 * (readiness updated, top insight, rating milestone, weak pattern) into the
 * Activity feed. Called ONLY by the background job; capped + deduped against
 * recent titles so it never spams or fires on request paths.
 */
export const competitiveActivityService = {
  async emit(userId: string, window: AnalyticsWindow = resolveAnalyticsWindow({ range: '30d' })): Promise<{ emitted: number }> {
    const [intel, ratingSummary, recent] = await Promise.all([
      competitiveIntelligenceService.overview(userId, window),
      ratingService.summary(userId),
      activityRepository.findRecentByUser(userId, 80),
    ]);
    const seen = new Set(recent.map((a) => a.title));
    let emitted = 0;
    const record = async (type: Parameters<typeof activityService.record>[1]['type'], title: string, description: string, entityId: string | null = null) => {
      if (seen.has(title)) return;
      await activityService.record(userId, { type, entityType: 'contest', entityId, title, description });
      seen.add(title);
      emitted += 1;
    };

    await record('contest-readiness-updated', `Contest readiness: ${intel.readiness.overall}%`, `You're ${intel.readiness.status} for contests.`);

    const topInsight = intel.insights[0];
    if (topInsight) await record('competitive-insight-generated', topInsight.title, topInsight.reason, topInsight.relatedTopics[0]?.id ?? null);

    if (ratingSummary.lastRatingChange != null && Math.abs(ratingSummary.lastRatingChange) >= RATING_MILESTONE_DELTA) {
      await record('rating-milestone-reached', `Rating milestone: ${ratingSummary.lastRatingChange > 0 ? '+' : ''}${ratingSummary.lastRatingChange}`, `Now at ${ratingSummary.currentRating}.`);
    }

    const topWeak = intel.weaknesses.find((w) => w.severity === 'high');
    if (topWeak) await record('weak-pattern-detected', `Weak pattern: ${topWeak.title}`, topWeak.detail, topWeak.entityId);

    return { emitted };
  },
};
