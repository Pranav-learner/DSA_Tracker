import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

/**
 * ContestPerformance — the aggregated, cached performance record for one
 * contest. Recomputed by ContestPerformanceService whenever the contest's
 * problems change; stored so the workspace reads it without re-aggregating.
 */
export interface IContestPerformance {
  contestRef: Types.ObjectId;
  userId: string;
  totalSolved: number;
  totalAttempts: number;
  wrongAttempts: number;
  penalty: number;
  averageSolveTime: number; // minutes
  fastestSolve: number | null; // minutes
  slowestSolve: number | null; // minutes
  solvedProblems: string[]; // problem codes
  unsolvedProblems: string[];
  skippedProblems: string[];
  createdAt: Date;
  updatedAt: Date;
}

const contestPerformanceSchema = new Schema<IContestPerformance>(
  {
    contestRef: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    totalSolved: { type: Number, required: true, default: 0 },
    totalAttempts: { type: Number, required: true, default: 0 },
    wrongAttempts: { type: Number, required: true, default: 0 },
    penalty: { type: Number, required: true, default: 0 },
    averageSolveTime: { type: Number, required: true, default: 0 },
    fastestSolve: { type: Number, default: null },
    slowestSolve: { type: Number, default: null },
    solvedProblems: { type: [String], default: [] },
    unsolvedProblems: { type: [String], default: [] },
    skippedProblems: { type: [String], default: [] },
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

export const ContestPerformance: Model<IContestPerformance> = model<IContestPerformance>(
  'ContestPerformance',
  contestPerformanceSchema,
);
export type ContestPerformanceDocument = HydratedDocument<IContestPerformance>;
