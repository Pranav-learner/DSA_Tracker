import { UpsolveTask, type UpsolveTaskDocument, type IUpsolveTask } from '../../models/UpsolveTask.js';
import type { FilterQuery } from 'mongoose';

/** Priority rank for stable queue ordering (high → low). */
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/**
 * UpsolveTaskRepository — sole owner of UpsolveTask persistence.
 */
export const upsolveTaskRepository = {
  create(input: Partial<IUpsolveTask>): Promise<UpsolveTaskDocument> {
    return UpsolveTask.create(input);
  },

  findById(id: string): Promise<UpsolveTaskDocument | null> {
    return UpsolveTask.findById(id).exec();
  },

  findByProblem(userId: string, contestProblemRef: string): Promise<UpsolveTaskDocument | null> {
    return UpsolveTask.findOne({ userId, contestProblemRef }).exec();
  },

  findByContest(userId: string, contestRef: string): Promise<UpsolveTaskDocument[]> {
    return UpsolveTask.find({ userId, contestRef }).exec();
  },

  /** All tasks for a user (optionally filtered), priority-ordered for the queue. */
  async findAll(userId: string, filter: FilterQuery<IUpsolveTask> = {}): Promise<UpsolveTaskDocument[]> {
    const docs = await UpsolveTask.find({ userId, ...filter }).exec();
    return docs.sort(
      (a, b) => (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3) || a.createdAt.getTime() - b.createdAt.getTime(),
    );
  },

  updateById(id: string, patch: Partial<IUpsolveTask>): Promise<UpsolveTaskDocument | null> {
    return UpsolveTask.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  },

  /** Status counts for the queue summary + dashboard. */
  async statusCounts(userId: string): Promise<Record<string, number>> {
    const rows = await UpsolveTask.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec();
    const out: Record<string, number> = {};
    for (const r of rows as Array<{ _id: string; count: number }>) out[r._id] = r.count;
    return out;
  },

  deleteByContest(userId: string, contestRef: string): Promise<unknown> {
    return UpsolveTask.deleteMany({ userId, contestRef }).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return UpsolveTask.deleteMany({ userId }).exec();
  },
};
