import { Achievement, type AchievementDocument, type IAchievement } from '../../models/Achievement.js';

/** Fields the engine writes when syncing an achievement row from the catalogue. */
export type AchievementUpsert = Pick<
  IAchievement,
  'title' | 'description' | 'category' | 'rarity' | 'icon' | 'maxProgress' | 'progress'
>;

/**
 * Achievement repository — sole owner of Achievement MongoDB operations. The
 * exactly-once unlock lives in `unlockIfNeeded` (an atomic conditional update),
 * so a duplicate unlock is structurally impossible.
 */
export const achievementRepository = {
  findByUser(userId: string): Promise<AchievementDocument[]> {
    return Achievement.find({ userId }).sort({ unlockedAt: -1, updatedAt: -1 }).exec();
  },

  findByKey(userId: string, achievementKey: string): Promise<AchievementDocument | null> {
    return Achievement.findOne({ userId, achievementKey }).exec();
  },

  /** Upsert the row's denormalised catalogue fields + current progress. */
  upsert(userId: string, achievementKey: string, data: AchievementUpsert): Promise<AchievementDocument> {
    return Achievement.findOneAndUpdate(
      { userId, achievementKey },
      { $set: data, $setOnInsert: { userId, achievementKey } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec() as Promise<AchievementDocument>;
  },

  /**
   * Atomically stamp `unlockedAt` iff the row is still locked. Returns the doc
   * only when THIS call performed the unlock (matched `unlockedAt: null`); a
   * concurrent/repeat call gets `null`. This is the duplicate-unlock guard.
   */
  unlockIfNeeded(userId: string, achievementKey: string, at: Date): Promise<AchievementDocument | null> {
    return Achievement.findOneAndUpdate(
      { userId, achievementKey, unlockedAt: null },
      { $set: { unlockedAt: at } },
      { new: true },
    ).exec();
  },

  countUnlocked(userId: string): Promise<number> {
    return Achievement.countDocuments({ userId, unlockedAt: { $ne: null } }).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return Achievement.deleteMany({ userId }).exec();
  },
};
