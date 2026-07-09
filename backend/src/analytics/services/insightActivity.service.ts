import { patternIntelligenceService } from './patternIntelligence.service.js';
import { activityService } from '../../services/activity.service.js';
import { activityRepository } from '../../repositories/activity.repository.js';
import { INSIGHT_LIMITS } from '../../config/insights.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type { ActivityType, ActivityEntityType } from '../../types/domain.js';
import type { InsightType } from '../dto/intelligence.dto.js';

const ACTIVITY_TYPE_BY_INSIGHT: Record<InsightType, ActivityType> = {
  weakness: 'pattern-at-risk',
  strength: 'pattern-improved',
  trend: 'insight-generated',
  milestone: 'insight-generated',
};

/**
 * InsightActivityService — records notable insights as Activity events (reusing
 * the Activity model). Called ONLY by the background analytics job, capped and
 * deduped against recent activity titles so it never spams the feed or fires on
 * request paths.
 */
export const insightActivityService = {
  async emit(userId: string, window: AnalyticsWindow): Promise<{ emitted: number }> {
    const [insights, recommendations, recent] = await Promise.all([
      patternIntelligenceService.insights(userId, window),
      patternIntelligenceService.recommendations(userId, window),
      activityRepository.findRecentByUser(userId, 80),
    ]);

    const seen = new Set(recent.map((a) => a.title));
    let emitted = 0;

    for (const ins of insights) {
      if (emitted >= INSIGHT_LIMITS.maxActivityEmit) break;
      if (ins.priority === 'low' || seen.has(ins.title)) continue;
      const entityType: ActivityEntityType = ins.entityType === 'phase' ? 'phase' : 'topic';
      await activityService.record(userId, {
        type: ACTIVITY_TYPE_BY_INSIGHT[ins.type],
        entityType,
        entityId: ins.entityId,
        title: ins.title,
        description: ins.message,
      });
      seen.add(ins.title);
      emitted += 1;
    }

    const topRec = recommendations[0];
    if (topRec && !seen.has(topRec.title)) {
      await activityService.record(userId, {
        type: 'recommendation-created',
        entityType: 'topic',
        entityId: topRec.entityId,
        title: topRec.title,
        description: topRec.reason,
      });
      emitted += 1;
    }

    return { emitted };
  },
};
