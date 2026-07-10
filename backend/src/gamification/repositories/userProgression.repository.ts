import {
  UserProgression,
  type UserProgressionDocument,
  type IUserProgression,
} from '../../models/UserProgression.js';

/**
 * UserProgression repository — sole owner of UserProgression MongoDB operations.
 * One document per user; `getOrCreate` guarantees it exists before reads.
 */
export const userProgressionRepository = {
  findByUser(userId: string): Promise<UserProgressionDocument | null> {
    return UserProgression.findOne({ userId }).exec();
  },

  /** Ensure a Level-1 / 0-XP progression exists for the user, and return it. */
  getOrCreate(userId: string): Promise<UserProgressionDocument> {
    return UserProgression.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec() as Promise<UserProgressionDocument>;
  },

  /**
   * Atomically add XP to the lifetime total and return the resulting document.
   * The `$inc` is what makes concurrent awards safe from lost-update races — the
   * returned doc reflects the *new* totalXP but the *pre-award* level/streak
   * fields (the engine derives and writes those next via `applyDerived`).
   */
  incrementXP(userId: string, xp: number): Promise<UserProgressionDocument> {
    return UserProgression.findOneAndUpdate(
      { userId },
      { $inc: { totalXP: xp }, $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec() as Promise<UserProgressionDocument>;
  },

  /** Persist the recomputed level + streak fields after an award. */
  applyDerived(
    userId: string,
    fields: Partial<
      Pick<
        IUserProgression,
        | 'currentLevel'
        | 'currentXP'
        | 'currentLevelXP'
        | 'nextLevelXP'
        | 'currentStreak'
        | 'longestStreak'
        | 'totalDaysActive'
        | 'lastActivityDate'
      >
    >,
  ): Promise<UserProgressionDocument> {
    return UserProgression.findOneAndUpdate(
      { userId },
      { $set: fields },
      { new: true },
    ).exec() as Promise<UserProgressionDocument>;
  },

  deleteByUser(userId: string): Promise<unknown> {
    return UserProgression.deleteOne({ userId }).exec();
  },
};
