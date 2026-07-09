import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import { PLATFORMS, type Platform } from '../types/domain.js';

/**
 * NotebookEntry — a learner's structured knowledge artifact for one problem
 * (Module 2 · Sprint 3, the Knowledge Engine).
 *
 * Every solved/representative problem can become a permanent entry in the
 * learner's "second brain": why the pattern was recognised, the key observation,
 * the core algorithm, complexities, alternatives, mistakes and lessons — plus
 * explicit **relationships** to related problems and other notebook entries.
 *
 * The relationships (`relatedProblems`, `relatedEntries`) are stored as id
 * references so a future Knowledge Graph (Module 4) can be built with no schema
 * change. Confidence is tracked (0–100) but never auto-calculated this sprint.
 */
export interface INotebookAlternative {
  title: string;
  detail: string;
}

export interface INotebookEntry {
  userId: string;
  problemId: Types.ObjectId;
  topicId: Types.ObjectId;
  phaseId: Types.ObjectId;

  // Denormalised identity (from the problem) so the list needs no join.
  title: string;
  platform: Platform;
  pattern: string;

  recognitionKeywords: string[];
  observation: string;
  coreAlgorithm: string;
  timeComplexity: string;
  spaceComplexity: string;
  alternativeSolutions: INotebookAlternative[];
  commonMistakes: string[];
  lessonsLearned: string;
  personalNotes: string;
  confidence: number; // 0–100

  // Knowledge relationships (id references → future Knowledge Graph).
  relatedProblems: Types.ObjectId[];
  relatedEntries: Types.ObjectId[];

  revisionDates: Date[];
  lastReviewedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const alternativeSchema = new Schema<INotebookAlternative>(
  {
    title: { type: String, required: true, trim: true },
    detail: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const notebookEntrySchema = new Schema<INotebookEntry>(
  {
    userId: { type: String, required: true, index: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: 'Phase', required: true },

    title: { type: String, required: true, trim: true },
    platform: { type: String, enum: PLATFORMS, required: true },
    pattern: { type: String, required: true, trim: true, index: true },

    recognitionKeywords: { type: [String], default: [] },
    observation: { type: String, default: '' },
    coreAlgorithm: { type: String, default: '' },
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    alternativeSolutions: { type: [alternativeSchema], default: [] },
    commonMistakes: { type: [String], default: [] },
    lessonsLearned: { type: String, default: '' },
    personalNotes: { type: String, default: '' },
    confidence: { type: Number, required: true, min: 0, max: 100, default: 50 },

    relatedProblems: { type: [Schema.Types.ObjectId], ref: 'Problem', default: [] },
    relatedEntries: { type: [Schema.Types.ObjectId], ref: 'NotebookEntry', default: [] },

    revisionDates: { type: [Date], default: [] },
    lastReviewedAt: { type: Date, default: null },
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

/** One notebook entry per (user, problem) — prevents duplicates. */
notebookEntrySchema.index({ userId: 1, problemId: 1 }, { unique: true });
notebookEntrySchema.index({ userId: 1, updatedAt: -1 });

export type NotebookEntryDocument = HydratedDocument<INotebookEntry>;

export const NotebookEntry: Model<INotebookEntry> = model<INotebookEntry>(
  'NotebookEntry',
  notebookEntrySchema,
);
