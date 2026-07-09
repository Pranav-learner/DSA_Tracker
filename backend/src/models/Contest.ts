import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { CONTEST_PLATFORMS, CONTEST_TYPES, type ContestPlatform, type ContestType } from '../types/domain.js';

/**
 * Contest — one competitive-programming contest entry for a user. Platform-
 * agnostic: `provider` records which ContestProvider owns the platform, and the
 * rating fields are optional so unrated/virtual contests fit the same shape.
 */
export interface IContest {
  userId: string;
  platform: ContestPlatform;
  provider: string;
  contestId: string;
  contestName: string;
  contestUrl: string;
  division: string;
  contestType: ContestType;
  startTime: Date;
  durationMinutes: number;
  ratingBefore: number | null;
  ratingAfter: number | null;
  ratingChange: number | null;
  rank: number | null;
  percentile: number | null;
  participated: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const contestSchema = new Schema<IContest>(
  {
    userId: { type: String, required: true, index: true },
    platform: { type: String, enum: CONTEST_PLATFORMS, required: true, index: true },
    provider: { type: String, required: true },
    contestId: { type: String, required: true, trim: true },
    contestName: { type: String, required: true, trim: true },
    contestUrl: { type: String, default: '' },
    division: { type: String, default: '' },
    contestType: { type: String, enum: CONTEST_TYPES, required: true, default: 'Rated' },
    startTime: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 0, default: 0 },
    ratingBefore: { type: Number, default: null },
    ratingAfter: { type: Number, default: null },
    ratingChange: { type: Number, default: null },
    rank: { type: Number, default: null, min: 0 },
    percentile: { type: Number, default: null, min: 0, max: 100 },
    participated: { type: Boolean, required: true, default: true },
    notes: { type: String, default: '' },
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

// One entry per (user, platform, contestId) — contest uniqueness.
contestSchema.index({ userId: 1, platform: 1, contestId: 1 }, { unique: true });
contestSchema.index({ userId: 1, startTime: -1 });

export const Contest: Model<IContest> = model<IContest>('Contest', contestSchema);
export type ContestDocument = HydratedDocument<IContest>;
