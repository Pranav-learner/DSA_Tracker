import {
  ContestTimelineEvent,
  type ContestTimelineEventDocument,
  type IContestTimelineEvent,
} from '../../models/ContestTimelineEvent.js';

/**
 * ContestTimelineRepository — sole owner of ContestTimelineEvent operations
 * (append-only; chronological reads).
 */
export const contestTimelineRepository = {
  create(input: Partial<IContestTimelineEvent>): Promise<ContestTimelineEventDocument> {
    return ContestTimelineEvent.create(input);
  },

  /** Chronological event stream for a contest (optionally capped for lazy loads). */
  findByContest(userId: string, contestRef: string, limit?: number): Promise<ContestTimelineEventDocument[]> {
    const q = ContestTimelineEvent.find({ userId, contestRef }).sort({ timestamp: 1, createdAt: 1 });
    return (limit ? q.limit(limit) : q).exec();
  },

  countByContest(userId: string, contestRef: string): Promise<number> {
    return ContestTimelineEvent.countDocuments({ userId, contestRef }).exec();
  },

  insertMany(docs: Partial<IContestTimelineEvent>[]): Promise<unknown> {
    return ContestTimelineEvent.insertMany(docs);
  },

  deleteByContest(userId: string, contestRef: string): Promise<unknown> {
    return ContestTimelineEvent.deleteMany({ userId, contestRef }).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return ContestTimelineEvent.deleteMany({ userId }).exec();
  },
};
