import {
  RevisionSchedule,
  type RevisionScheduleDocument,
  type IRevisionSchedule,
} from '../models/RevisionSchedule.js';
import type { FilterQuery, SortOrder } from 'mongoose';

export interface RevisionSearchOptions {
  skip: number;
  limit: number;
  sort: Record<string, SortOrder>;
}

/**
 * RevisionSchedule repository — sole owner of RevisionSchedule MongoDB
 * operations. Services never touch Mongoose directly.
 */
export const revisionScheduleRepository = {
  create(input: Partial<IRevisionSchedule>): Promise<RevisionScheduleDocument> {
    return RevisionSchedule.create(input);
  },

  findById(id: string): Promise<RevisionScheduleDocument | null> {
    return RevisionSchedule.findById(id).exec();
  },

  /** An active (non-archived) schedule for a specific entity, if any. */
  findActiveForEntity(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<RevisionScheduleDocument | null> {
    return RevisionSchedule.findOne({
      userId,
      entityType,
      entityId,
      status: { $ne: 'Archived' },
    }).exec();
  },

  /** All of a user's active (Pending) schedules — the source for the queue. */
  findActive(userId: string): Promise<RevisionScheduleDocument[]> {
    return RevisionSchedule.find({ userId, status: 'Pending' }).sort({ nextReviewDate: 1 }).exec();
  },

  /** Active schedules whose next review falls within [from, to] — for the calendar. */
  findByDateRange(userId: string, from: Date, to: Date): Promise<RevisionScheduleDocument[]> {
    return RevisionSchedule.find({
      userId,
      status: 'Pending',
      nextReviewDate: { $gte: from, $lte: to },
    })
      .sort({ nextReviewDate: 1 })
      .exec();
  },

  async search(
    filter: FilterQuery<IRevisionSchedule>,
    { skip, limit, sort }: RevisionSearchOptions,
  ): Promise<{ items: RevisionScheduleDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      RevisionSchedule.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      RevisionSchedule.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  countByUser(userId: string): Promise<number> {
    return RevisionSchedule.countDocuments({ userId, status: { $ne: 'Archived' } }).exec();
  },

  updateById(id: string, patch: Partial<IRevisionSchedule>): Promise<RevisionScheduleDocument | null> {
    return RevisionSchedule.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  },

  deleteById(id: string): Promise<RevisionScheduleDocument | null> {
    return RevisionSchedule.findByIdAndDelete(id).exec();
  },

  insertMany(docs: Partial<IRevisionSchedule>[]): Promise<unknown> {
    return RevisionSchedule.insertMany(docs);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return RevisionSchedule.deleteMany({ userId }).exec();
  },
};
