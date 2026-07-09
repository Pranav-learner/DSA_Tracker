import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import { PROBLEM_STATUSES, type ProblemStatus } from '../types/domain.js';

/**
 * UserProblem — a user's per-problem state overlay. Kept separate from the
 * shared `Problem` catalog so the library stays immutable per user.
 *
 * Sprint 1 held the browse state (status + favorite). Sprint 2 adds the
 * **attempt-derived aggregates** below: they are recomputed from the immutable
 * `Attempt` history by the AttemptService on every create/update/delete, so they
 * never drift from the source of truth.
 */
export interface IUserProblem {
  userId: string;
  problemId: Types.ObjectId;
  status: ProblemStatus;
  favorite: boolean;
  lastViewed: Date | null;

  // --- Sprint 2: attempt-derived aggregates (recomputed, never hand-set) ---
  totalAttempts: number;
  firstSolvedAt: Date | null;
  latestAttemptAt: Date | null;
  totalTimeSpent: number; // minutes across all attempts
  solved: boolean;
  solvedWithoutHint: boolean;
  solvedWithoutEditorial: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const userProblemSchema = new Schema<IUserProblem>(
  {
    userId: { type: String, required: true, index: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    status: { type: String, enum: PROBLEM_STATUSES, required: true, default: 'Not Started' },
    favorite: { type: Boolean, required: true, default: false },
    lastViewed: { type: Date, default: null },

    // --- Sprint 2: attempt-derived aggregates ---
    totalAttempts: { type: Number, required: true, min: 0, default: 0 },
    firstSolvedAt: { type: Date, default: null },
    latestAttemptAt: { type: Date, default: null },
    totalTimeSpent: { type: Number, required: true, min: 0, default: 0 },
    solved: { type: Boolean, required: true, default: false },
    solvedWithoutHint: { type: Boolean, required: true, default: false },
    solvedWithoutEditorial: { type: Boolean, required: true, default: false },
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

/** One record per (user, problem). */
userProblemSchema.index({ userId: 1, problemId: 1 }, { unique: true });
userProblemSchema.index({ userId: 1, status: 1 });
userProblemSchema.index({ userId: 1, favorite: 1 });

export type UserProblemDocument = HydratedDocument<IUserProblem>;

export const UserProblem: Model<IUserProblem> = model<IUserProblem>(
  'UserProblem',
  userProblemSchema,
);
