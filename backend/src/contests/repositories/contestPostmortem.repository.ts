import {
  ContestPostmortem,
  type ContestPostmortemDocument,
  type IContestPostmortem,
} from '../../models/ContestPostmortem.js';

/**
 * ContestPostmortemRepository — sole owner of ContestPostmortem persistence.
 */
export const contestPostmortemRepository = {
  create(input: Partial<IContestPostmortem>): Promise<ContestPostmortemDocument> {
    return ContestPostmortem.create(input);
  },

  findByContest(userId: string, contestRef: string): Promise<ContestPostmortemDocument | null> {
    return ContestPostmortem.findOne({ userId, contestRef }).exec();
  },

  updateByContest(userId: string, contestRef: string, patch: Partial<IContestPostmortem>): Promise<ContestPostmortemDocument | null> {
    return ContestPostmortem.findOneAndUpdate({ userId, contestRef }, { $set: patch }, { new: true }).exec();
  },

  /** Recent postmortems for a user (history). */
  findRecent(userId: string, limit = 10): Promise<ContestPostmortemDocument[]> {
    return ContestPostmortem.find({ userId }).sort({ updatedAt: -1 }).limit(limit).exec();
  },

  deleteByContest(userId: string, contestRef: string): Promise<unknown> {
    return ContestPostmortem.deleteOne({ userId, contestRef }).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return ContestPostmortem.deleteMany({ userId }).exec();
  },
};
