import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

/**
 * ReadinessProfile — a persisted snapshot of the learner's readiness across
 * tracks. Contest readiness is fully computed this sprint; interview and HFT
 * readiness are architecture PLACEHOLDERS (Module 6+), stored so future modules
 * can populate them without a schema change. One per user.
 */
export interface IReadinessProfile {
  userId: string;
  contestReadiness: number;
  interviewReadiness: number; // placeholder
  hftReadiness: number; // placeholder
  /** The contest sub-scores that fed `contestReadiness`, for auditability. */
  breakdown: {
    pattern: number;
    implementation: number;
    revision: number;
    knowledge: number;
    recentPractice: number;
    contestFrequency: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const readinessProfileSchema = new Schema<IReadinessProfile>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    contestReadiness: { type: Number, required: true, default: 0 },
    interviewReadiness: { type: Number, required: true, default: 0 },
    hftReadiness: { type: Number, required: true, default: 0 },
    breakdown: {
      pattern: { type: Number, default: 0 },
      implementation: { type: Number, default: 0 },
      revision: { type: Number, default: 0 },
      knowledge: { type: Number, default: 0 },
      recentPractice: { type: Number, default: 0 },
      contestFrequency: { type: Number, default: 0 },
    },
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

export const ReadinessProfile: Model<IReadinessProfile> = model<IReadinessProfile>(
  'ReadinessProfile',
  readinessProfileSchema,
);
export type ReadinessProfileDocument = HydratedDocument<IReadinessProfile>;
