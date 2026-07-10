import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { ACHIEVEMENT_RARITIES, type AchievementRarity } from '../types/domain.js';

/**
 * Achievement — a user's progress toward, and unlock of, one catalogue
 * achievement (Module 6 · Sprint 2). One row per (user, achievementKey); the row
 * is upserted as progress accrues and stamped with `unlockedAt` exactly once.
 *
 * Rows are materialised from the ACHIEVEMENT_DEFS catalogue by the
 * ProgressionRulesEngine; `title`/`description`/`rarity`/`icon` are denormalised
 * onto the row so the API/UI need not re-join the config.
 */
export interface IAchievement {
  userId: string;
  achievementKey: string;
  title: string;
  description: string;
  category: string;
  rarity: AchievementRarity;
  icon: string;
  /** Null until unlocked; the exactly-once unlock guard. */
  unlockedAt: Date | null;
  progress: number;
  maxProgress: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    userId: { type: String, required: true, index: true },
    achievementKey: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    rarity: { type: String, enum: ACHIEVEMENT_RARITIES, required: true, default: 'Common' },
    icon: { type: String, default: '🏅' },
    unlockedAt: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0 },
    maxProgress: { type: Number, required: true, min: 1 },
    metadata: { type: Schema.Types.Mixed, default: {} },
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

/** One achievement row per user — the duplicate-unlock guard. */
achievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });

export type AchievementDocument = HydratedDocument<IAchievement>;

export const Achievement: Model<IAchievement> = model<IAchievement>('Achievement', achievementSchema);
