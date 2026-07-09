import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';
import { CONTEST_PLATFORMS, type ContestPlatform } from '../types/domain.js';

/**
 * RatingHistory — one rating datapoint per rated contest, per platform. Kept
 * separate from Contest so the rating timeline can be queried and charted
 * cheaply without loading full contest documents. Maintained by RatingService.
 */
export interface IRatingHistory {
  userId: string;
  platform: ContestPlatform;
  contestRef: Types.ObjectId;
  contestId: string;
  rating: number;
  ratingChange: number;
  contestDate: Date;
  createdAt: Date;
}

const ratingHistorySchema = new Schema<IRatingHistory>(
  {
    userId: { type: String, required: true, index: true },
    platform: { type: String, enum: CONTEST_PLATFORMS, required: true, index: true },
    contestRef: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
    contestId: { type: String, required: true },
    rating: { type: Number, required: true },
    ratingChange: { type: Number, required: true, default: 0 },
    contestDate: { type: Date, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// One rating point per contest; fast per-user/platform timeline reads.
ratingHistorySchema.index({ userId: 1, contestRef: 1 }, { unique: true });
ratingHistorySchema.index({ userId: 1, platform: 1, contestDate: 1 });

export const RatingHistory: Model<IRatingHistory> = model<IRatingHistory>('RatingHistory', ratingHistorySchema);
export type RatingHistoryDocument = HydratedDocument<IRatingHistory>;
