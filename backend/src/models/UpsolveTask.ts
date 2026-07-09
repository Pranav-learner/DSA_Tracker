import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';
import { UPSOLVE_STATUSES, UPSOLVE_PRIORITIES, type UpsolvePriority, type UpsolveStatus } from '../types/domain.js';

/**
 * UpsolveTask — a problem to upsolve after a contest, per user. Bridges a
 * ContestProblem into the Learning Engine: completing a task syncs mastery,
 * revision and knowledge via the existing services (links stored here).
 */
export interface IUpsolveTask {
  contestRef: Types.ObjectId;
  contestProblemRef: Types.ObjectId;
  userId: string;
  topicId: Types.ObjectId | null;
  pattern: string;
  priority: UpsolvePriority;
  status: UpsolveStatus;
  estimatedTime: number; // minutes
  linkedKnowledgeEntry: Types.ObjectId | null;
  linkedRevisionSchedule: Types.ObjectId | null;
  // denormalised for display
  problemCode: string;
  problemName: string;
  url: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const upsolveTaskSchema = new Schema<IUpsolveTask>(
  {
    contestRef: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    contestProblemRef: { type: Schema.Types.ObjectId, ref: 'ContestProblem', required: true },
    userId: { type: String, required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', default: null },
    pattern: { type: String, default: '' },
    priority: { type: String, enum: UPSOLVE_PRIORITIES, required: true, default: 'medium' },
    status: { type: String, enum: UPSOLVE_STATUSES, required: true, default: 'Pending' },
    estimatedTime: { type: Number, required: true, min: 0, default: 30 },
    linkedKnowledgeEntry: { type: Schema.Types.ObjectId, ref: 'NotebookEntry', default: null },
    linkedRevisionSchedule: { type: Schema.Types.ObjectId, ref: 'RevisionSchedule', default: null },
    problemCode: { type: String, default: '' },
    problemName: { type: String, default: '' },
    url: { type: String, default: '' },
    completedAt: { type: Date, default: null },
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

// One task per (user, contest problem); fast queue reads by status/priority.
upsolveTaskSchema.index({ userId: 1, contestProblemRef: 1 }, { unique: true });
upsolveTaskSchema.index({ userId: 1, status: 1, priority: 1 });

export const UpsolveTask: Model<IUpsolveTask> = model<IUpsolveTask>('UpsolveTask', upsolveTaskSchema);
export type UpsolveTaskDocument = HydratedDocument<IUpsolveTask>;
