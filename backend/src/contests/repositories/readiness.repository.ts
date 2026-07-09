import { ReadinessProfile, type ReadinessProfileDocument, type IReadinessProfile } from '../../models/ReadinessProfile.js';

/**
 * ReadinessRepository — sole owner of ReadinessProfile persistence.
 */
export const readinessRepository = {
  findByUser(userId: string): Promise<ReadinessProfileDocument | null> {
    return ReadinessProfile.findOne({ userId }).exec();
  },

  upsert(userId: string, patch: Partial<IReadinessProfile>): Promise<ReadinessProfileDocument | null> {
    return ReadinessProfile.findOneAndUpdate({ userId }, { $set: { ...patch, userId } }, { new: true, upsert: true }).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return ReadinessProfile.deleteMany({ userId }).exec();
  },
};
