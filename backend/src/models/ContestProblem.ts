import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

/**
 * ContestProblem — one problem within a contest workspace, per user. Tracks the
 * outcome (solved/skipped/attempted), attempt count, timing and penalty so the
 * ContestPerformanceService can aggregate the contest's performance.
 */
export interface IContestProblem {
  contestRef: Types.ObjectId;
  userId: string;
  problemCode: string;
  problemName: string;
  platformProblemId: string;
  url: string;
  index: string; // A, B, C…
  difficulty: string;
  tags: string[];
  solved: boolean;
  skipped: boolean;
  attempted: boolean;
  attempts: number;
  firstAttemptAt: Date | null;
  solvedAt: Date | null;
  totalTimeSpent: number; // minutes
  penalty: number; // minutes (ICPC-style, 0 when unsolved)
  createdAt: Date;
  updatedAt: Date;
}

const contestProblemSchema = new Schema<IContestProblem>(
  {
    contestRef: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    userId: { type: String, required: true, index: true },
    problemCode: { type: String, required: true, trim: true },
    problemName: { type: String, required: true, trim: true },
    platformProblemId: { type: String, default: '' },
    url: { type: String, default: '' },
    index: { type: String, default: '', trim: true },
    difficulty: { type: String, default: '' },
    tags: { type: [String], default: [] },
    solved: { type: Boolean, required: true, default: false },
    skipped: { type: Boolean, required: true, default: false },
    attempted: { type: Boolean, required: true, default: false },
    attempts: { type: Number, required: true, min: 0, default: 0 },
    firstAttemptAt: { type: Date, default: null },
    solvedAt: { type: Date, default: null },
    totalTimeSpent: { type: Number, required: true, min: 0, default: 0 },
    penalty: { type: Number, required: true, min: 0, default: 0 },
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

// One entry per (user, contest, problemCode) — problem uniqueness within a contest.
contestProblemSchema.index({ userId: 1, contestRef: 1, problemCode: 1 }, { unique: true });
contestProblemSchema.index({ contestRef: 1, index: 1 });

export const ContestProblem: Model<IContestProblem> = model<IContestProblem>('ContestProblem', contestProblemSchema);
export type ContestProblemDocument = HydratedDocument<IContestProblem>;
