import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import {
  ATTEMPT_STATUSES,
  ATTEMPT_VERDICTS,
  ATTEMPT_LANGUAGES,
  type AttemptLanguage,
  type AttemptStatus,
  type AttemptVerdict,
} from '../types/domain.js';

/**
 * Attempt — one entry in a problem's solving journey (Module 2 · Sprint 2).
 *
 * A problem is not merely "Solved": it accumulates a permanent, ordered history
 * of attempts (Wrong Answer → TLE → Solved …). Each attempt is immutable history
 * once created (editable, soft-deletable) and never destroys prior records.
 * Aggregates (totals, first solve, time spent) are recomputed onto `UserProblem`
 * by the AttemptService, so they can never drift.
 */
export interface IAttempt {
  userId: string;
  problemId: Types.ObjectId;
  attemptNumber: number;
  status: AttemptStatus;
  verdict: AttemptVerdict;
  language: AttemptLanguage;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number;
  wrongAttempts: number;
  usedHint: boolean;
  usedEditorial: boolean;
  contestAttempt: boolean;
  upsolved: boolean;
  notes: string;
  /** Soft-delete marker — excluded from history/aggregates when set. */
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const attemptSchema = new Schema<IAttempt>(
  {
    userId: { type: String, required: true, index: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ATTEMPT_STATUSES, required: true, default: 'Started' },
    verdict: { type: String, enum: ATTEMPT_VERDICTS, required: true, default: 'Unknown' },
    language: { type: String, enum: ATTEMPT_LANGUAGES, required: true, default: 'Other' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    durationMinutes: { type: Number, required: true, min: 0, default: 0 },
    wrongAttempts: { type: Number, required: true, min: 0, default: 0 },
    usedHint: { type: Boolean, required: true, default: false },
    usedEditorial: { type: Boolean, required: true, default: false },
    contestAttempt: { type: Boolean, required: true, default: false },
    upsolved: { type: Boolean, required: true, default: false },
    notes: { type: String, default: '', trim: true },
    deletedAt: { type: Date, default: null },
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

// History reads are always "a user's attempts on a problem, newest first".
attemptSchema.index({ userId: 1, problemId: 1, createdAt: -1 });
attemptSchema.index({ createdAt: -1 });

export type AttemptDocument = HydratedDocument<IAttempt>;

export const Attempt: Model<IAttempt> = model<IAttempt>('Attempt', attemptSchema);
