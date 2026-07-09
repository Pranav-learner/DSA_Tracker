import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import { LADDER_STAGES, type LadderStage } from '../types/domain.js';

/**
 * LearningState — a user's "where am I" pointer into the roadmap.
 *
 * Only the pointer fields are persisted; aggregate figures (overall progress,
 * counts, estimated completion) are computed dynamically by the ProgressService
 * so they can never drift out of sync.
 */
export interface ILearningState {
  userId: string;
  currentPhaseId: Types.ObjectId | null;
  currentTopicId: Types.ObjectId | null;
  currentStage: LadderStage;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const learningStateSchema = new Schema<ILearningState>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    currentPhaseId: { type: Schema.Types.ObjectId, ref: 'Phase', default: null },
    currentTopicId: { type: Schema.Types.ObjectId, ref: 'Topic', default: null },
    currentStage: { type: String, enum: LADDER_STAGES, required: true, default: 'recognition' },
    lastActiveAt: { type: Date, default: null },
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

export type LearningStateDocument = HydratedDocument<ILearningState>;

export const LearningState: Model<ILearningState> = model<ILearningState>(
  'LearningState',
  learningStateSchema,
);
