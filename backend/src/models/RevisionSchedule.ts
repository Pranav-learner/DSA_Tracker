import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import {
  REVISION_ENTITY_TYPES,
  REVISION_STATUSES,
  type RevisionEntityType,
  type RevisionStatus,
} from '../types/domain.js';
import { DEFAULT_EASE_FACTOR } from '../config/revision.js';

/**
 * RevisionSchedule — when the learner should next revise a piece of knowledge
 * (Module 3 · Sprint 1).
 *
 * One schedule tracks the spacing state for an entity (a completed topic, a
 * pattern, or a knowledge/notebook entry). The scheduling MATH is delegated to a
 * pluggable `RevisionStrategy` (strategy name stored here), so SM-2 / AI can plug
 * in later with no schema change. `easeFactor` is stored now for exactly that.
 *
 * `status` is the LIFECYCLE (Pending / Completed / Archived). Due / Overdue are
 * derived from `nextReviewDate` at read time and never persisted.
 */
export interface IRevisionSchedule {
  userId: string;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  currentInterval: number; // days
  nextReviewDate: Date;
  lastReviewDate: Date | null;
  reviewCount: number;
  easeFactor: number;
  priority: number; // 1–5, higher = more important
  status: RevisionStatus;
  strategy: string;
  createdAt: Date;
  updatedAt: Date;
}

const revisionScheduleSchema = new Schema<IRevisionSchedule>(
  {
    userId: { type: String, required: true, index: true },
    entityType: { type: String, enum: REVISION_ENTITY_TYPES, required: true, index: true },
    entityId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    currentInterval: { type: Number, required: true, min: 0, default: 1 },
    nextReviewDate: { type: Date, required: true, index: true },
    lastReviewDate: { type: Date, default: null },
    reviewCount: { type: Number, required: true, min: 0, default: 0 },
    easeFactor: { type: Number, required: true, default: DEFAULT_EASE_FACTOR },
    priority: { type: Number, required: true, min: 1, max: 5, default: 3 },
    status: { type: String, enum: REVISION_STATUSES, required: true, default: 'Pending', index: true },
    strategy: { type: String, required: true, default: 'default' },
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

// Fast lookups: a user's active queue (by next date), and dedup per entity.
revisionScheduleSchema.index({ userId: 1, status: 1, nextReviewDate: 1 });
revisionScheduleSchema.index({ userId: 1, entityType: 1, entityId: 1 });

export type RevisionScheduleDocument = HydratedDocument<IRevisionSchedule>;

export const RevisionSchedule: Model<IRevisionSchedule> = model<IRevisionSchedule>(
  'RevisionSchedule',
  revisionScheduleSchema,
);
