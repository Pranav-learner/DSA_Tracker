import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import {
  DIFFICULTIES,
  PLATFORMS,
  type Difficulty,
  type ConceptExample,
  type RepresentativeProblem,
} from '../types/domain.js';

/**
 * Topic — the second level of the hierarchy, belonging to a Phase.
 * (Roadmap → Phase → **Topic** → Pattern → Problem).
 *
 * Sprint 2 enriches each topic into a full study workspace: conceptual content,
 * recognition keywords, topic relations (by slug) and read-only representative
 * problems. All new fields default to empty so older data stays valid.
 */
export interface ITopic {
  phaseId: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  order: number;
  estimatedHours: number;
  estimatedProblems: number;
  difficulty: Difficulty;
  isUnlocked: boolean;
  isCompleted: boolean;

  // --- Sprint 2: concept content ---
  coreIdea: string;
  whenToUse: string;
  whenNotToUse: string;
  timeComplexity: string;
  spaceComplexity: string;
  advantages: string[];
  limitations: string[];
  applications: string[];
  examples: ConceptExample[];

  // --- Sprint 2: recognition & relations (relations stored as topic slugs) ---
  recognitionKeywords: string[];
  prerequisites: string[];
  relatedTopics: string[];

  // --- Sprint 2: read-only representative problems ---
  representativeProblems: RepresentativeProblem[];

  // --- Sprint 3: optional per-topic mastery threshold override ---
  masteryThreshold?: number;

  createdAt: Date;
  updatedAt: Date;
}

const exampleSchema = new Schema<ConceptExample>(
  {
    title: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const representativeProblemSchema = new Schema<RepresentativeProblem>({
  name: { type: String, required: true, trim: true },
  platform: { type: String, required: true, enum: PLATFORMS },
  difficulty: { type: String, required: true, enum: DIFFICULTIES },
  pattern: { type: String, required: true, trim: true },
  url: { type: String, trim: true },
  estimatedMinutes: { type: Number, required: true, min: 0, default: 30 },
});

const topicSchema = new Schema<ITopic>(
  {
    phaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Phase',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0 },
    estimatedHours: { type: Number, required: true, min: 0, default: 0 },
    estimatedProblems: { type: Number, required: true, min: 0, default: 0 },
    difficulty: {
      type: String,
      required: true,
      enum: DIFFICULTIES,
      default: 'Medium',
    },
    isUnlocked: { type: Boolean, required: true, default: false },
    isCompleted: { type: Boolean, required: true, default: false },

    // --- Sprint 2 fields ---
    coreIdea: { type: String, default: '' },
    whenToUse: { type: String, default: '' },
    whenNotToUse: { type: String, default: '' },
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    advantages: { type: [String], default: [] },
    limitations: { type: [String], default: [] },
    applications: { type: [String], default: [] },
    examples: { type: [exampleSchema], default: [] },
    recognitionKeywords: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    relatedTopics: { type: [String], default: [] },
    representativeProblems: { type: [representativeProblemSchema], default: [] },
    masteryThreshold: { type: Number, min: 0, max: 100 },
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

/** A topic slug is unique within its phase, not globally. */
topicSchema.index({ phaseId: 1, slug: 1 }, { unique: true });
topicSchema.index({ phaseId: 1, order: 1 });

export type TopicDocument = HydratedDocument<ITopic>;

export const Topic: Model<ITopic> = model<ITopic>('Topic', topicSchema);
