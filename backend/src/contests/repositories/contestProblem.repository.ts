import { ContestProblem, type ContestProblemDocument, type IContestProblem } from '../../models/ContestProblem.js';

/**
 * ContestProblemRepository — sole owner of ContestProblem MongoDB operations.
 */
export const contestProblemRepository = {
  create(input: Partial<IContestProblem>): Promise<ContestProblemDocument> {
    return ContestProblem.create(input);
  },

  findById(id: string): Promise<ContestProblemDocument | null> {
    return ContestProblem.findById(id).exec();
  },

  findByContest(userId: string, contestRef: string): Promise<ContestProblemDocument[]> {
    return ContestProblem.find({ userId, contestRef }).sort({ index: 1, createdAt: 1 }).exec();
  },

  findByCode(userId: string, contestRef: string, problemCode: string): Promise<ContestProblemDocument | null> {
    return ContestProblem.findOne({ userId, contestRef, problemCode }).exec();
  },

  updateById(id: string, patch: Partial<IContestProblem>): Promise<ContestProblemDocument | null> {
    return ContestProblem.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  },

  deleteById(id: string): Promise<ContestProblemDocument | null> {
    return ContestProblem.findByIdAndDelete(id).exec();
  },

  insertMany(docs: Partial<IContestProblem>[]): Promise<unknown> {
    return ContestProblem.insertMany(docs);
  },

  deleteByContest(userId: string, contestRef: string): Promise<unknown> {
    return ContestProblem.deleteMany({ userId, contestRef }).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return ContestProblem.deleteMany({ userId }).exec();
  },
};
