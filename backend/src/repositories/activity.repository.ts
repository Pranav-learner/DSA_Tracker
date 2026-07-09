import { Activity, type ActivityDocument, type IActivity } from '../models/Activity.js';

/** Shape accepted when appending a new activity event. */
export type ActivityInput = Pick<IActivity, 'type' | 'entityType' | 'entityId' | 'title' | 'description'>;

/**
 * Activity repository — sole owner of Activity MongoDB operations. Kept minimal:
 * append events and read the most recent ones for a user.
 */
export const activityRepository = {
  /** Most recent events for a user, newest first. */
  findRecentByUser(userId: string, limit = 10): Promise<ActivityDocument[]> {
    return Activity.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
  },

  create(userId: string, input: ActivityInput): Promise<ActivityDocument> {
    return Activity.create({ userId, ...input });
  },

  /** Bulk insert (used by the seed). Optional explicit timestamps for a story feel. */
  insertMany(
    docs: (ActivityInput & { userId: string; createdAt?: Date })[],
  ): Promise<unknown> {
    return Activity.insertMany(docs);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return Activity.deleteMany({ userId }).exec();
  },
};
