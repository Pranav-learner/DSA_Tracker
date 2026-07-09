import { activityRepository, type ActivityInput } from '../repositories/activity.repository.js';
import { logger } from '../utils/logger.js';
import type { ActivityDocument } from '../models/Activity.js';
import type { ActivityType, ActivityEntityType } from '../types/domain.js';

/** Serialised activity event returned by the API (dates as ISO strings). */
export interface ActivityDTO {
  id: string;
  type: ActivityType;
  entityType: ActivityEntityType;
  entityId: string | null;
  title: string;
  description: string;
  createdAt: string;
}

function toActivityDTO(doc: ActivityDocument): ActivityDTO {
  return {
    id: String(doc._id),
    type: doc.type,
    entityType: doc.entityType,
    entityId: doc.entityId ?? null,
    title: doc.title,
    description: doc.description,
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * ActivityService — recent learning events for the dashboard timeline.
 *
 * Two responsibilities: read the recent feed (`getRecent`) and append an event
 * (`record`). `record` is intentionally best-effort — logging a timeline event
 * must never break the learning mutation that triggered it, so failures are
 * swallowed. This is the reuse point for future modules (problems, revision…).
 */
export const activityService = {
  async getRecent(userId: string, limit = 10): Promise<ActivityDTO[]> {
    const docs = await activityRepository.findRecentByUser(userId, limit);
    return docs.map(toActivityDTO);
  },

  async record(userId: string, input: ActivityInput): Promise<void> {
    try {
      await activityRepository.create(userId, input);
    } catch (err) {
      // Non-critical: never let activity logging break the caller's flow.
      logger.warn('Failed to record activity', err);
    }
  },
};
