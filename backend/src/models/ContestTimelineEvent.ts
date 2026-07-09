import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';
import { CONTEST_EVENT_TYPES, type ContestEventType } from '../types/domain.js';

/**
 * ContestTimelineEvent — an append-only chronological event within a contest
 * (opened a problem, submission, accepted, contest finished…). Powers the
 * contest timeline; never mutated after creation.
 */
export interface IContestTimelineEvent {
  contestRef: Types.ObjectId;
  userId: string;
  timestamp: Date;
  eventType: ContestEventType;
  problemRef: Types.ObjectId | null;
  problemCode: string;
  description: string;
  createdAt: Date;
}

const contestTimelineEventSchema = new Schema<IContestTimelineEvent>(
  {
    contestRef: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
    userId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    eventType: { type: String, enum: CONTEST_EVENT_TYPES, required: true },
    problemRef: { type: Schema.Types.ObjectId, ref: 'ContestProblem', default: null },
    problemCode: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

// Chronological reads scoped to a contest.
contestTimelineEventSchema.index({ contestRef: 1, timestamp: 1 });

export const ContestTimelineEvent: Model<IContestTimelineEvent> = model<IContestTimelineEvent>(
  'ContestTimelineEvent',
  contestTimelineEventSchema,
);
export type ContestTimelineEventDocument = HydratedDocument<IContestTimelineEvent>;
