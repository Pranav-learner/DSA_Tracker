import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import {
  ACTIVITY_TYPES,
  ACTIVITY_ENTITY_TYPES,
  type ActivityType,
  type ActivityEntityType,
} from '../types/domain.js';

/**
 * Activity — a single recent learning event for a user (started/completed/
 * unlocked a topic, mastery updated, …).
 *
 * This is a **lightweight event log**, deliberately NOT an analytics store: it
 * records discrete events only, keyed by user, newest-first. It is intentionally
 * generic (`entityType` + `entityId`) so later modules (problems, revision,
 * contests) can append their own events without a schema change.
 */
export interface IActivity {
  userId: string;
  type: ActivityType;
  entityType: ActivityEntityType;
  entityId: string | null;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    entityType: { type: String, enum: ACTIVITY_ENTITY_TYPES, required: true },
    entityId: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
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

/** Recent-first lookups per user are the only read pattern. */
activitySchema.index({ userId: 1, createdAt: -1 });

export type ActivityDocument = HydratedDocument<IActivity>;

export const Activity: Model<IActivity> = model<IActivity>('Activity', activitySchema);
