import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import { DIFFICULTIES, PLATFORMS, type Difficulty, type Platform } from '../types/domain.js';

/**
 * Problem — a single catalog entry in the Problem Library (Module 2).
 *
 * The library is the central, **read-only** catalog of DSA / CP problems. Each
 * problem belongs to a phase + topic and carries the metadata needed to browse,
 * filter and open it. Per-user solve state lives separately in `UserProblem`, so
 * this document is shared and immutable per user.
 */
export interface IProblem {
  title: string;
  slug: string;
  platform: Platform;
  platformProblemId: string;
  url: string;
  difficulty: Difficulty;
  /** Denormalised for fast sort/filter without a $lookup on the enum string. */
  difficultyRank: number;
  phaseId: Types.ObjectId;
  topicId: Types.ObjectId;
  pattern: string;
  tags: string[];
  editorialUrl?: string;
  representative: boolean;
  estimatedSolveTime: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

const problemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    platform: { type: String, required: true, enum: PLATFORMS, index: true },
    platformProblemId: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
    difficulty: { type: String, required: true, enum: DIFFICULTIES, index: true },
    difficultyRank: { type: Number, required: true, min: 0, default: 0 },
    phaseId: { type: Schema.Types.ObjectId, ref: 'Phase', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    pattern: { type: String, required: true, trim: true, index: true },
    tags: { type: [String], default: [] },
    editorialUrl: { type: String, trim: true },
    representative: { type: Boolean, required: true, default: false, index: true },
    estimatedSolveTime: { type: Number, required: true, min: 0, default: 30 },
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

// Compound index for the common "browse a topic, ordered by difficulty" path.
problemSchema.index({ topicId: 1, difficultyRank: 1 });

export type ProblemDocument = HydratedDocument<IProblem>;

export const Problem: Model<IProblem> = model<IProblem>('Problem', problemSchema);
