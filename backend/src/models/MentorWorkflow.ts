import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { WORKFLOW_KEYS, type WorkflowKey, type WorkflowStatus, type WorkflowStepDTO } from '../ai/os/types.js';

/**
 * MentorWorkflow — a generated learning workflow the learner chose to keep
 * (Module 7 · Sprint 4). A workflow is a SEQUENCE OF SUGGESTED STEPS, never an
 * autonomous process — each step is a deep link the learner follows. Persisting
 * generated workflows powers GET /workflows, the timeline, and lets us avoid
 * regenerating an identical plan.
 */
export interface IMentorWorkflow {
  userId: string;
  key: WorkflowKey;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  modules: string[];
  steps: WorkflowStepDTO[];
  expectedOutcome: string;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
}

const mentorWorkflowSchema = new Schema<IMentorWorkflow>(
  {
    userId: { type: String, required: true, index: true },
    key: { type: String, enum: WORKFLOW_KEYS, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    difficulty: { type: String, default: 'moderate' },
    estimatedMinutes: { type: Number, default: 0 },
    modules: { type: [String], default: [] },
    // Stored as a single Mixed blob (the step array) to sidestep Mongoose's
    // typed-array inference; the shape is the typed WorkflowStepDTO[].
    steps: { type: Schema.Types.Mixed, default: [] },
    expectedOutcome: { type: String, default: '' },
    status: { type: String, enum: ['generated', 'started', 'completed', 'dismissed'], default: 'generated' },
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

/** Recent-first workflow list per user. */
mentorWorkflowSchema.index({ userId: 1, updatedAt: -1 });

export type MentorWorkflowDocument = HydratedDocument<IMentorWorkflow>;

export const MentorWorkflow: Model<IMentorWorkflow> = model<IMentorWorkflow>('MentorWorkflow', mentorWorkflowSchema);
