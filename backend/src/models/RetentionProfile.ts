import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import {
  REVISION_ENTITY_TYPES,
  RETENTION_LEVELS,
  type RetentionLevel,
  type RevisionEntityType,
} from '../types/domain.js';

/**
 * RetentionProfile — how well a piece of knowledge is retained over time
 * (Module 3 · Sprint 3).
 *
 * One profile per (user, entity). Scores evolve from revision performance +
 * time-based decay; the level is derived. A small capped `history` powers the
 * confidence/retention trend without a separate collection. The scoring MATH is
 * delegated to the ConfidenceService / RetentionService / DecayStrategy — the
 * document stores state only.
 */
export interface IRetentionSnapshot {
  confidenceScore: number;
  retentionScore: number;
  level: RetentionLevel;
  reason: string;
  date: Date;
}

export interface IRetentionProfile {
  userId: string;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  /** Resolved topic for mastery synchronization (null for pattern entities). */
  topicId: Types.ObjectId | null;

  confidenceScore: number; // 0–100
  retentionScore: number; // 0–100
  decayScore: number; // current daily decay rate (points/day)
  currentLevel: RetentionLevel;

  reviewCount: number;
  successfulReviews: number;
  missedReviews: number;
  overdueReviews: number;
  averageReviewInterval: number; // days

  lastReviewDate: Date | null;
  nextReviewDate: Date | null;
  /** Last time decay was applied (so the job is idempotent per day). */
  lastDecayDate: Date | null;
  strategy: string;

  history: IRetentionSnapshot[];

  createdAt: Date;
  updatedAt: Date;
}

const snapshotSchema = new Schema<IRetentionSnapshot>(
  {
    confidenceScore: { type: Number, required: true, min: 0, max: 100 },
    retentionScore: { type: Number, required: true, min: 0, max: 100 },
    level: { type: String, enum: RETENTION_LEVELS, required: true },
    reason: { type: String, default: '' },
    date: { type: Date, required: true },
  },
  { _id: false },
);

const retentionProfileSchema = new Schema<IRetentionProfile>(
  {
    userId: { type: String, required: true, index: true },
    entityType: { type: String, enum: REVISION_ENTITY_TYPES, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', default: null },

    confidenceScore: { type: Number, required: true, min: 0, max: 100, default: 50 },
    retentionScore: { type: Number, required: true, min: 0, max: 100, default: 50 },
    decayScore: { type: Number, required: true, min: 0, default: 0 },
    currentLevel: { type: String, enum: RETENTION_LEVELS, required: true, default: 'Learning' },

    reviewCount: { type: Number, required: true, min: 0, default: 0 },
    successfulReviews: { type: Number, required: true, min: 0, default: 0 },
    missedReviews: { type: Number, required: true, min: 0, default: 0 },
    overdueReviews: { type: Number, required: true, min: 0, default: 0 },
    averageReviewInterval: { type: Number, required: true, min: 0, default: 0 },

    lastReviewDate: { type: Date, default: null },
    nextReviewDate: { type: Date, default: null },
    lastDecayDate: { type: Date, default: null },
    strategy: { type: String, required: true, default: 'default' },

    history: { type: [snapshotSchema], default: [] },
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

/** One profile per (user, entity). */
retentionProfileSchema.index({ userId: 1, entityType: 1, entityId: 1 }, { unique: true });
retentionProfileSchema.index({ userId: 1, nextReviewDate: 1 });

export type RetentionProfileDocument = HydratedDocument<IRetentionProfile>;

export const RetentionProfile: Model<IRetentionProfile> = model<IRetentionProfile>(
  'RetentionProfile',
  retentionProfileSchema,
);
