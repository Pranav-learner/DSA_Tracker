import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { RECOMMENDATION_STATUSES, type MentorAction, type RecommendationPriority, type RecommendationSource, type RecommendationStatus } from '../ai/os/types.js';

/**
 * Recommendation — a tracked AI suggestion (Module 7 · Sprint 4). This is the
 * AI OS's OWN data, not learning data: the AI recommends, the learner decides.
 * Each row carries a stable per-user `key` so regeneration updates in place
 * (no duplicates) while preserving the lifecycle a learner has driven
 * (viewed → accepted → completed / dismissed → archived).
 */
export interface IRecommendation {
  userId: string;
  key: string;
  title: string;
  reason: string;
  priority: RecommendationPriority;
  source: RecommendationSource;
  action: MentorAction | null;
  status: RecommendationStatus;
  intent: string | null;
  coachId: string | null;
  viewedAt: Date | null;
  acceptedAt: Date | null;
  dismissedAt: Date | null;
  completedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    userId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    reason: { type: String, default: '' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    source: { type: String, enum: ['coach', 'workflow', 'brief', 'analytics', 'system'], default: 'system' },
    action: { type: Schema.Types.Mixed, default: null },
    status: { type: String, enum: RECOMMENDATION_STATUSES, default: 'generated' },
    intent: { type: String, default: null },
    coachId: { type: String, default: null },
    viewedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    dismissedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
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

/** One row per (user, key) — the dedupe/upsert contract. */
recommendationSchema.index({ userId: 1, key: 1 }, { unique: true });
/** Recommendation-center reads (filter by status, newest first). */
recommendationSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export type RecommendationDocument = HydratedDocument<IRecommendation>;

export const Recommendation: Model<IRecommendation> = model<IRecommendation>('Recommendation', recommendationSchema);
