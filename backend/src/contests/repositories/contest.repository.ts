import { Contest, type ContestDocument, type IContest } from '../../models/Contest.js';
import type { FilterQuery, SortOrder } from 'mongoose';

export interface ContestSearchOptions {
  skip: number;
  limit: number;
  sort: Record<string, SortOrder>;
}

/**
 * ContestRepository — sole owner of Contest MongoDB operations. Only database
 * operations live here; every read is scoped by the caller-supplied filter
 * (the service always injects `userId`).
 */
export const contestRepository = {
  create(input: Partial<IContest>): Promise<ContestDocument> {
    return Contest.create(input);
  },

  findById(id: string): Promise<ContestDocument | null> {
    return Contest.findById(id).exec();
  },

  findByContestId(userId: string, platform: string, contestId: string): Promise<ContestDocument | null> {
    return Contest.findOne({ userId, platform, contestId }).exec();
  },

  async search(filter: FilterQuery<IContest>, { skip, limit, sort }: ContestSearchOptions): Promise<{ items: ContestDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      Contest.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      Contest.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  findAll(userId: string, filter: FilterQuery<IContest> = {}): Promise<ContestDocument[]> {
    return Contest.find({ userId, ...filter }).sort({ startTime: -1 }).exec();
  },

  updateById(id: string, patch: Partial<IContest>): Promise<ContestDocument | null> {
    return Contest.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  },

  deleteById(id: string): Promise<ContestDocument | null> {
    return Contest.findByIdAndDelete(id).exec();
  },

  /** Distinct platforms present for a user — powers the data-driven filters. */
  distinctPlatforms(userId: string): Promise<string[]> {
    return Contest.distinct('platform', { userId }).exec() as Promise<string[]>;
  },

  distinctDivisions(userId: string): Promise<string[]> {
    return Contest.distinct('division', { userId, division: { $ne: '' } }).exec() as Promise<string[]>;
  },

  /** Aggregate contest statistics in a single pipeline (no per-doc loading). */
  async stats(userId: string): Promise<{
    total: number;
    rated: number;
    virtual: number;
    participated: number;
    avgRank: number;
    avgRatingChange: number;
    firstDate: Date | null;
    lastDate: Date | null;
  }> {
    const [row] = await Contest.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          rated: { $sum: { $cond: [{ $eq: ['$contestType', 'Rated'] }, 1, 0] } },
          virtual: { $sum: { $cond: [{ $eq: ['$contestType', 'Virtual'] }, 1, 0] } },
          participated: { $sum: { $cond: ['$participated', 1, 0] } },
          avgRank: { $avg: '$rank' },
          avgRatingChange: { $avg: '$ratingChange' },
          firstDate: { $min: '$startTime' },
          lastDate: { $max: '$startTime' },
        },
      },
    ]).exec();
    return {
      total: row?.total ?? 0,
      rated: row?.rated ?? 0,
      virtual: row?.virtual ?? 0,
      participated: row?.participated ?? 0,
      avgRank: Math.round(row?.avgRank ?? 0),
      avgRatingChange: Math.round(row?.avgRatingChange ?? 0),
      firstDate: row?.firstDate ?? null,
      lastDate: row?.lastDate ?? null,
    };
  },

  /** Platform distribution (count per platform). */
  async platformDistribution(userId: string): Promise<{ platform: string; count: number }[]> {
    const rows = await Contest.aggregate([
      { $match: { userId } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec();
    return rows.map((r: { _id: string; count: number }) => ({ platform: r._id, count: r.count }));
  },

  insertMany(docs: Partial<IContest>[]): Promise<unknown> {
    return Contest.insertMany(docs);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return Contest.deleteMany({ userId }).exec();
  },
};
