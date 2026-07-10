import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

/**
 * Badge — a collectible the user has earned (Module 6 · Sprint 2). Simpler than
 * an Achievement: it exists only once unlocked (there is no locked/in-progress
 * row). One row per (user, badgeKey), guaranteed by the unique index.
 */
export interface IBadge {
  userId: string;
  badgeKey: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    userId: { type: String, required: true, index: true },
    badgeKey: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    icon: { type: String, default: '🎖️' },
    unlockedAt: { type: Date, default: Date.now },
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

/** One badge row per user — the duplicate-award guard. */
badgeSchema.index({ userId: 1, badgeKey: 1 }, { unique: true });

export type BadgeDocument = HydratedDocument<IBadge>;

export const Badge: Model<IBadge> = model<IBadge>('Badge', badgeSchema);
