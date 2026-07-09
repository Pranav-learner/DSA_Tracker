import { UserProblem, type UserProblemDocument, type IUserProblem } from '../models/UserProblem.js';
import type { ProblemStatus } from '../types/domain.js';

/**
 * UserProblem repository — sole owner of UserProblem MongoDB operations. Reads
 * overlay the shared catalog with a user's status/favorite; writes exist for the
 * seed (and future Attempt Tracking).
 */
export const userProblemRepository = {
  findByUserAndProblem(userId: string, problemId: string): Promise<UserProblemDocument | null> {
    return UserProblem.findOne({ userId, problemId }).exec();
  },

  findByUserAndProblems(userId: string, problemIds: string[]): Promise<UserProblemDocument[]> {
    if (problemIds.length === 0) return Promise.resolve([]);
    return UserProblem.find({ userId, problemId: { $in: problemIds } }).exec();
  },

  /** Problem ids for a user filtered by status and/or favorite (for list filters). */
  async problemIdsByState(
    userId: string,
    state: { status?: ProblemStatus; favorite?: boolean },
  ): Promise<string[]> {
    const query: Record<string, unknown> = { userId };
    if (state.status) query.status = state.status;
    if (state.favorite !== undefined) query.favorite = state.favorite;
    const rows = await UserProblem.find(query).select('problemId').exec();
    return rows.map((r) => String(r.problemId));
  },

  upsert(
    userId: string,
    problemId: string,
    update: Partial<IUserProblem>,
  ): Promise<UserProblemDocument> {
    return UserProblem.findOneAndUpdate(
      { userId, problemId },
      { $set: update, $setOnInsert: { userId, problemId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec() as Promise<UserProblemDocument>;
  },

  insertMany(docs: Partial<IUserProblem>[]): Promise<unknown> {
    return UserProblem.insertMany(docs);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return UserProblem.deleteMany({ userId }).exec();
  },
};
