import { TopicProgress, type TopicProgressDocument, type ITopicProgress } from '../models/TopicProgress.js';

/**
 * TopicProgress repository — sole owner of TopicProgress MongoDB operations.
 */
export const topicProgressRepository = {
  findByUser(userId: string): Promise<TopicProgressDocument[]> {
    return TopicProgress.find({ userId }).exec();
  },

  findByUserAndTopic(userId: string, topicId: string): Promise<TopicProgressDocument | null> {
    return TopicProgress.findOne({ userId, topicId }).exec();
  },

  findByUserAndTopics(userId: string, topicIds: string[]): Promise<TopicProgressDocument[]> {
    if (topicIds.length === 0) return Promise.resolve([]);
    return TopicProgress.find({ userId, topicId: { $in: topicIds } }).exec();
  },

  /** Create or update a progress record (upsert on {userId, topicId}). */
  upsert(
    userId: string,
    topicId: string,
    update: Partial<ITopicProgress>,
  ): Promise<TopicProgressDocument> {
    return TopicProgress.findOneAndUpdate(
      { userId, topicId },
      { $set: update, $setOnInsert: { userId, topicId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec() as Promise<TopicProgressDocument>;
  },

  /** Status counts for a user, keyed by status. */
  async statusCounts(userId: string): Promise<Record<string, number>> {
    const rows = await TopicProgress.aggregate<{ _id: string; count: number }>([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec();
    return Object.fromEntries(rows.map((r) => [r._id, r.count]));
  },

  deleteByUser(userId: string): Promise<unknown> {
    return TopicProgress.deleteMany({ userId }).exec();
  },
};
