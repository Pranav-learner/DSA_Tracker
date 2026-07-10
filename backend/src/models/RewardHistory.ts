import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { REWARD_TYPES, ACTIVITY_TYPES, type RewardType, type ActivityType } from '../types/domain.js';

/**
 * RewardHistory — the immutable ledger of every reward the engine has minted
 * (Module 6 · Sprint 1). One row per rewarded Activity event.
 *
 * Duplicate protection is structural: a UNIQUE index on `{ userId, activityId }`
 * makes a second reward for the same event impossible. The engine inserts the
 * row FIRST (before touching XP), so the unique index doubles as an idempotency
 * lock — a duplicate insert throws E11000 and the award is aborted before any XP
 * moves. That gives exactly-once semantics without needing a transaction.
 *
 * Field semantics:
 *   • rewardType   — the reward *mechanism* ('xp' this sprint; 'badge'/'achievement'
 *                    are the Sprint 2 seam). Powers the "Reward Type" filter.
 *   • rewardSource — the *activity type* that earned it (e.g. 'problem-solved').
 *                    Powers the "Activity Type" filter and joins back to Activity.
 *   • xpAwarded    — XP granted by this row.
 *   • reason       — human-readable justification (from the reward rule).
 *   • metadata     — free-form context (module, entityType/Id, title, levelUp…).
 *
 * `createdAt` is an explicit field (no Mongoose `timestamps`) — rewards are
 * immutable (no updatedAt) and the engine sets `createdAt` to when the activity
 * actually occurred, so backfills/replays date correctly.
 */
export interface IRewardHistory {
  userId: string;
  activityId: string;
  rewardType: RewardType;
  rewardSource: ActivityType;
  xpAwarded: number;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const rewardHistorySchema = new Schema<IRewardHistory>(
  {
    userId: { type: String, required: true, index: true },
    activityId: { type: String, required: true, index: true },
    rewardType: { type: String, enum: REWARD_TYPES, required: true, default: 'xp' },
    rewardSource: { type: String, enum: ACTIVITY_TYPES, required: true },
    xpAwarded: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '', trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
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

/** The idempotency lock: at most one reward per activity event, per user. */
rewardHistorySchema.index({ userId: 1, activityId: 1 }, { unique: true });
/** Recent-first history reads per user. */
rewardHistorySchema.index({ userId: 1, createdAt: -1 });

export type RewardHistoryDocument = HydratedDocument<IRewardHistory>;

export const RewardHistory: Model<IRewardHistory> = model<IRewardHistory>(
  'RewardHistory',
  rewardHistorySchema,
);
