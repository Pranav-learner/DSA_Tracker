import { RatingHistory, type RatingHistoryDocument, type IRatingHistory } from '../../models/RatingHistory.js';
import type { FilterQuery } from 'mongoose';

/**
 * RatingRepository — sole owner of RatingHistory MongoDB operations.
 */
export const ratingRepository = {
  create(input: Partial<IRatingHistory>): Promise<RatingHistoryDocument> {
    return RatingHistory.create(input);
  },

  findByContest(userId: string, contestRef: string): Promise<RatingHistoryDocument | null> {
    return RatingHistory.findOne({ userId, contestRef }).exec();
  },

  /** Full rating timeline for a user (optionally one platform), oldest first. */
  findHistory(userId: string, filter: FilterQuery<IRatingHistory> = {}): Promise<RatingHistoryDocument[]> {
    return RatingHistory.find({ userId, ...filter }).sort({ contestDate: 1 }).exec();
  },

  /** Most recent rating point (optionally per platform). */
  findLatest(userId: string, filter: FilterQuery<IRatingHistory> = {}): Promise<RatingHistoryDocument | null> {
    return RatingHistory.findOne({ userId, ...filter }).sort({ contestDate: -1 }).exec();
  },

  updateByContest(userId: string, contestRef: string, patch: Partial<IRatingHistory>): Promise<RatingHistoryDocument | null> {
    return RatingHistory.findOneAndUpdate({ userId, contestRef }, { $set: patch }, { new: true }).exec();
  },

  deleteByContest(userId: string, contestRef: string): Promise<unknown> {
    return RatingHistory.deleteOne({ userId, contestRef }).exec();
  },

  insertMany(docs: Partial<IRatingHistory>[]): Promise<unknown> {
    return RatingHistory.insertMany(docs);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return RatingHistory.deleteMany({ userId }).exec();
  },
};
