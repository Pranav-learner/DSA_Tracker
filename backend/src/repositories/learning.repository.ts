import { LearningState, type LearningStateDocument, type ILearningState } from '../models/LearningState.js';

/**
 * Learning repository — sole owner of LearningState MongoDB operations.
 */
export const learningRepository = {
  findByUser(userId: string): Promise<LearningStateDocument | null> {
    return LearningState.findOne({ userId }).exec();
  },

  upsert(userId: string, update: Partial<ILearningState>): Promise<LearningStateDocument> {
    return LearningState.findOneAndUpdate(
      { userId },
      { $set: update, $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec() as Promise<LearningStateDocument>;
  },

  deleteByUser(userId: string): Promise<unknown> {
    return LearningState.deleteOne({ userId }).exec();
  },
};
