import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import {
  CHALLENGE_TYPES,
  CHALLENGE_STATUSES,
  type ChallengeType,
  type ChallengeStatus,
  type ActivityType,
} from '../types/domain.js';

/**
 * Challenge — a live, time-boxed goal for a user (Module 6 · Sprint 2).
 * Instantiated from a CHALLENGE_TEMPLATE, advanced by matching activity events,
 * and completed/expired by the engine. Recurring types (Daily/Weekly/Monthly)
 * are regenerated when the previous instance expires.
 *
 * `activityType` (the advancing event) and `periodKey` (e.g. '2026-07-10' for a
 * daily) are stored so progress matching and "one per period" regeneration are
 * cheap and idempotent.
 */
export interface IChallenge {
  userId: string;
  challengeKey: string;
  title: string;
  description: string;
  challengeType: ChallengeType;
  /** The activity type whose occurrences advance this challenge. */
  activityType: ActivityType;
  targetValue: number;
  currentProgress: number;
  rewardXP: number;
  rewardBadge: string | null;
  status: ChallengeStatus;
  /** Identifies the period instance (day/week/month key) for regeneration. */
  periodKey: string;
  expiresAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const challengeSchema = new Schema<IChallenge>(
  {
    userId: { type: String, required: true, index: true },
    challengeKey: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    challengeType: { type: String, enum: CHALLENGE_TYPES, required: true, index: true },
    activityType: { type: String, required: true },
    targetValue: { type: Number, required: true, min: 1 },
    currentProgress: { type: Number, default: 0, min: 0 },
    rewardXP: { type: Number, default: 0, min: 0 },
    rewardBadge: { type: String, default: null },
    status: { type: String, enum: CHALLENGE_STATUSES, required: true, default: 'Active', index: true },
    periodKey: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
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

/** At most one instance of a challenge template per user per period. */
challengeSchema.index({ userId: 1, challengeKey: 1, periodKey: 1 }, { unique: true });
/** Active-set lookups. */
challengeSchema.index({ userId: 1, status: 1, challengeType: 1 });

export type ChallengeDocument = HydratedDocument<IChallenge>;

export const Challenge: Model<IChallenge> = model<IChallenge>('Challenge', challengeSchema);
