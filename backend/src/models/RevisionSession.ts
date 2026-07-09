import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import {
  REVISION_ENTITY_TYPES,
  REVISION_SESSION_STATUSES,
  type RevisionEntityType,
  type RevisionSessionStatus,
} from '../types/domain.js';

/**
 * RevisionSession — one active-review session (Module 3 · Sprint 2).
 *
 * A session records what the learner reviewed and for how long. Knowledge content
 * is NOT copied here — it is reused live from Module 2 (topic / notebook / problem);
 * a session only stores references, notes and self-rated confidence (values only —
 * no retention/decay calculations this sprint). Completing a session advances the
 * owning RevisionSchedule via the Sprint-1 strategy.
 */
export interface IRevisionSession {
  userId: string;
  revisionScheduleId: Types.ObjectId | null;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  sessionStatus: RevisionSessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  durationMinutes: number;
  reviewedKnowledgeEntries: string[];
  reviewedProblems: string[];
  reviewNotes: string;
  selfConfidenceBefore: number | null;
  selfConfidenceAfter: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const revisionSessionSchema = new Schema<IRevisionSession>(
  {
    userId: { type: String, required: true, index: true },
    revisionScheduleId: { type: Schema.Types.ObjectId, ref: 'RevisionSchedule', default: null, index: true },
    entityType: { type: String, enum: REVISION_ENTITY_TYPES, required: true },
    entityId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    sessionStatus: { type: String, enum: REVISION_SESSION_STATUSES, required: true, default: 'Started' },
    startedAt: { type: Date, required: true, index: true },
    completedAt: { type: Date, default: null },
    durationMinutes: { type: Number, required: true, min: 0, default: 0 },
    reviewedKnowledgeEntries: { type: [String], default: [] },
    reviewedProblems: { type: [String], default: [] },
    reviewNotes: { type: String, default: '' },
    selfConfidenceBefore: { type: Number, min: 0, max: 100, default: null },
    selfConfidenceAfter: { type: Number, min: 0, max: 100, default: null },
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

// History reads + "the one active session" lookup.
revisionSessionSchema.index({ userId: 1, startedAt: -1 });
revisionSessionSchema.index({ userId: 1, sessionStatus: 1 });
revisionSessionSchema.index({ userId: 1, entityId: 1, startedAt: -1 });

export type RevisionSessionDocument = HydratedDocument<IRevisionSession>;

export const RevisionSession: Model<IRevisionSession> = model<IRevisionSession>(
  'RevisionSession',
  revisionSessionSchema,
);
