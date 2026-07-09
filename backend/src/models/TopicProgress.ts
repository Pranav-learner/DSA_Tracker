import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import {
  LADDER_STAGES,
  TOPIC_PROGRESS_STATUSES,
  type LadderStage,
  type TopicProgressStatus,
} from '../types/domain.js';

/**
 * TopicProgress — a user's mastery record for one topic.
 *
 * The eight flat metric scores (0–100) are the single source of truth; the
 * MasteryService derives `overallMastery` (cached here on write) and the ladder
 * from them. This is NOT a problem tracker — it stores mastery signals only.
 */
export interface ITopicProgress {
  userId: string;
  topicId: Types.ObjectId;

  // --- the eight weighted mastery metrics (0–100) ---
  recognitionScore: number;
  implementationScore: number;
  standardScore: number;
  variantScore: number;
  mixedScore: number;
  contestScore: number;
  assessmentScore: number;
  confidence: number;

  // --- derived caches (written only by the service layer) ---
  overallMastery: number;
  assessmentPassed: boolean;
  currentStage: LadderStage;
  status: TopicProgressStatus;

  startedAt: Date | null;
  lastStudied: Date | null;
  completedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const score = { type: Number, required: true, min: 0, max: 100, default: 0 };

const topicProgressSchema = new Schema<ITopicProgress>(
  {
    userId: { type: String, required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },

    recognitionScore: score,
    implementationScore: score,
    standardScore: score,
    variantScore: score,
    mixedScore: score,
    contestScore: score,
    assessmentScore: score,
    confidence: score,

    overallMastery: { type: Number, required: true, min: 0, max: 100, default: 0 },
    assessmentPassed: { type: Boolean, required: true, default: false },
    currentStage: { type: String, enum: LADDER_STAGES, required: true, default: 'recognition' },
    status: {
      type: String,
      enum: TOPIC_PROGRESS_STATUSES,
      required: true,
      default: 'Not Started',
    },

    startedAt: { type: Date, default: null },
    lastStudied: { type: Date, default: null },
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

/** One progress record per (user, topic). */
topicProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
topicProgressSchema.index({ userId: 1, status: 1 });

export type TopicProgressDocument = HydratedDocument<ITopicProgress>;

export const TopicProgress: Model<ITopicProgress> = model<ITopicProgress>(
  'TopicProgress',
  topicProgressSchema,
);
