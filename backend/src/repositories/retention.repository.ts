import {
  RetentionProfile,
  type RetentionProfileDocument,
  type IRetentionProfile,
} from '../models/RetentionProfile.js';
import type { FilterQuery } from 'mongoose';

/**
 * Retention repository — sole owner of RetentionProfile MongoDB operations.
 */
export const retentionRepository = {
  findById(id: string): Promise<RetentionProfileDocument | null> {
    return RetentionProfile.findById(id).exec();
  },

  findByEntity(userId: string, entityId: string): Promise<RetentionProfileDocument | null> {
    return RetentionProfile.findOne({ userId, entityId }).exec();
  },

  findAll(userId: string, filter: FilterQuery<IRetentionProfile> = {}): Promise<RetentionProfileDocument[]> {
    return RetentionProfile.find({ userId, ...filter }).sort({ nextReviewDate: 1 }).exec();
  },

  create(input: Partial<IRetentionProfile>): Promise<RetentionProfileDocument> {
    return RetentionProfile.create(input);
  },

  updateById(id: string, patch: Partial<IRetentionProfile>): Promise<RetentionProfileDocument | null> {
    return RetentionProfile.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  },

  /**
   * Aggregate averages + counts for the overview (one pipeline, no per-entity
   * recomputation). Levels are effective, so counts are computed in the service
   * from the loaded profiles; this returns the cheap numeric aggregates.
   */
  async aggregateOverview(userId: string): Promise<{
    count: number;
    avgConfidence: number;
    avgRetention: number;
    reviewCount: number;
    successfulReviews: number;
  }> {
    const [row] = await RetentionProfile.aggregate<{
      count: number;
      avgConfidence: number;
      avgRetention: number;
      reviewCount: number;
      successfulReviews: number;
    }>([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidenceScore' },
          avgRetention: { $avg: '$retentionScore' },
          reviewCount: { $sum: '$reviewCount' },
          successfulReviews: { $sum: '$successfulReviews' },
        },
      },
    ]).exec();
    return row ?? { count: 0, avgConfidence: 0, avgRetention: 0, reviewCount: 0, successfulReviews: 0 };
  },

  insertMany(docs: Partial<IRetentionProfile>[]): Promise<unknown> {
    return RetentionProfile.insertMany(docs);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return RetentionProfile.deleteMany({ userId }).exec();
  },
};
