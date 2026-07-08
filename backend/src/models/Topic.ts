import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import { DIFFICULTIES, type Difficulty } from '../types/domain.js';

/**
 * Topic — the second level of the hierarchy, belonging to a Phase.
 * (Roadmap → Phase → **Topic** → Pattern → Problem).
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
  createdAt: Date;
  updatedAt: Date;
}

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
