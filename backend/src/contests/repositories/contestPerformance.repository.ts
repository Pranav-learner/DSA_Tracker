import {
  ContestPerformance,
  type ContestPerformanceDocument,
  type IContestPerformance,
} from '../../models/ContestPerformance.js';

/**
 * ContestPerformanceRepository — sole owner of ContestPerformance operations.
 * The record is a cache: upserted whenever the contest's problems change.
 */
export const contestPerformanceRepository = {
  findByContest(userId: string, contestRef: string): Promise<ContestPerformanceDocument | null> {
    return ContestPerformance.findOne({ userId, contestRef }).exec();
  },

  upsert(userId: string, contestRef: string, patch: Partial<IContestPerformance>): Promise<ContestPerformanceDocument | null> {
    return ContestPerformance.findOneAndUpdate(
      { userId, contestRef },
      { $set: { ...patch, userId, contestRef } },
      { new: true, upsert: true },
    ).exec();
  },

  deleteByContest(userId: string, contestRef: string): Promise<unknown> {
    return ContestPerformance.deleteOne({ userId, contestRef }).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return ContestPerformance.deleteMany({ userId }).exec();
  },
};
