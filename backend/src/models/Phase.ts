import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

/**
 * Phase — the top level of the learning roadmap hierarchy
 * (Roadmap → **Phase** → Topic → Pattern → Problem).
 */
export interface IPhase {
  title: string;
  slug: string;
  order: number;
  description: string;
  icon: string;
  estimatedWeeks: number;
  estimatedProblems: number;
  color: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const phaseSchema = new Schema<IPhase>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    order: { type: Number, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, required: true, default: 'circle' },
    estimatedWeeks: { type: Number, required: true, min: 0, default: 0 },
    estimatedProblems: { type: Number, required: true, min: 0, default: 0 },
    color: { type: String, required: true, default: '#6366f1' },
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

/** Virtual populate — topics belonging to this phase (not persisted). */
phaseSchema.virtual('topics', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'phaseId',
});

export type PhaseDocument = HydratedDocument<IPhase>;

export const Phase: Model<IPhase> = model<IPhase>('Phase', phaseSchema);
