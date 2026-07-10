import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

/**
 * UserProgression — a user's persisted progression snapshot (Module 6 · Sprint 1).
 *
 * There is exactly one document per user. It is a *materialised* record kept in
 * sync by the Reward Engine; the source of truth for "what happened" remains the
 * Activity + RewardHistory logs, so this can always be rebuilt by replaying them.
 *
 * XP field semantics (documented once, relied on everywhere):
 *   • totalXP        — lifetime cumulative XP earned; monotonic, never resets.
 *   • currentLevel   — level derived from totalXP by the LevelService.
 *   • currentXP      — XP earned *within* the current level (progress numerator),
 *                      i.e. totalXP minus the level's floor threshold.
 *   • currentLevelXP — absolute XP threshold at which the current level began.
 *   • nextLevelXP    — XP *span* of the current level (progress denominator),
 *                      i.e. ceilThreshold − floorThreshold.
 * So: progress = currentXP / nextLevelXP, and xpRemaining = nextLevelXP − currentXP.
 */
export interface IUserProgression {
  userId: string;
  currentXP: number;
  currentLevel: number;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  lastActivityDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userProgressionSchema = new Schema<IUserProgression>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    currentXP: { type: Number, default: 0, min: 0 },
    currentLevel: { type: Number, default: 1, min: 1 },
    totalXP: { type: Number, default: 0, min: 0 },
    currentLevelXP: { type: Number, default: 0, min: 0 },
    nextLevelXP: { type: Number, default: 0, min: 0 },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    totalDaysActive: { type: Number, default: 0, min: 0 },
    lastActivityDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

export type UserProgressionDocument = HydratedDocument<IUserProgression>;

export const UserProgression: Model<IUserProgression> = model<IUserProgression>(
  'UserProgression',
  userProgressionSchema,
);
