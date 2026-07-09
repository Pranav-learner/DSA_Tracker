import {
  RevisionSession,
  type RevisionSessionDocument,
  type IRevisionSession,
} from '../models/RevisionSession.js';
import type { FilterQuery, SortOrder } from 'mongoose';

export interface SessionSearchOptions {
  skip: number;
  limit: number;
  sort: Record<string, SortOrder>;
}

/**
 * RevisionSession repository — sole owner of RevisionSession MongoDB operations.
 */
export const revisionSessionRepository = {
  create(input: Partial<IRevisionSession>): Promise<RevisionSessionDocument> {
    return RevisionSession.create(input);
  },

  findById(id: string): Promise<RevisionSessionDocument | null> {
    return RevisionSession.findById(id).exec();
  },

  /** The user's single active (Started) session, if any. */
  findActive(userId: string): Promise<RevisionSessionDocument | null> {
    return RevisionSession.findOne({ userId, sessionStatus: 'Started' }).sort({ startedAt: -1 }).exec();
  },

  async search(
    filter: FilterQuery<IRevisionSession>,
    { skip, limit, sort }: SessionSearchOptions,
  ): Promise<{ items: RevisionSessionDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      RevisionSession.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      RevisionSession.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  findByEntity(userId: string, entityId: string): Promise<RevisionSessionDocument[]> {
    return RevisionSession.find({ userId, entityId }).sort({ startedAt: -1 }).exec();
  },

  /** Recent sessions for the dashboard (any status), newest first. */
  findRecent(userId: string, limit: number): Promise<RevisionSessionDocument[]> {
    return RevisionSession.find({ userId }).sort({ startedAt: -1 }).limit(limit).exec();
  },

  /** Count completed sessions since a moment (today's completed count). */
  countCompletedSince(userId: string, since: Date): Promise<number> {
    return RevisionSession.countDocuments({
      userId,
      sessionStatus: 'Completed',
      completedAt: { $gte: since },
    }).exec();
  },

  updateById(id: string, patch: Partial<IRevisionSession>): Promise<RevisionSessionDocument | null> {
    return RevisionSession.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  },

  insertMany(docs: Partial<IRevisionSession>[]): Promise<unknown> {
    return RevisionSession.insertMany(docs);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return RevisionSession.deleteMany({ userId }).exec();
  },
};
