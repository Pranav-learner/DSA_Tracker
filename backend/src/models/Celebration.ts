import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { CELEBRATION_TYPES, type CelebrationType } from '../types/domain.js';

/**
 * Celebration — a frontend-friendly "something worth celebrating happened" event
 * (Module 6 · Sprint 2). The CelebrationService writes these when a level-up,
 * achievement, badge, challenge completion or milestone occurs; the frontend
 * reads them to drive toasts/modals/animations.
 *
 * Backend stays UI-agnostic: a celebration carries only data (type, title,
 * description, icon, rarity, metadata) — never animation logic. `seen` lets the
 * client show each celebration once without re-triggering.
 */
export interface ICelebration {
  userId: string;
  type: CelebrationType;
  title: string;
  description: string;
  icon: string;
  /** Optional rarity/level for styling (e.g. an achievement's rarity). */
  rarity: string | null;
  /** Bonus XP associated with the event, if any (for the reward animation). */
  xp: number;
  metadata: Record<string, unknown>;
  seen: boolean;
  createdAt: Date;
}

const celebrationSchema = new Schema<ICelebration>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: CELEBRATION_TYPES, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🎉' },
    rarity: { type: String, default: null },
    xp: { type: Number, default: 0, min: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    seen: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
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

/** Recent-first feed per user. */
celebrationSchema.index({ userId: 1, createdAt: -1 });

export type CelebrationDocument = HydratedDocument<ICelebration>;

export const Celebration: Model<ICelebration> = model<ICelebration>('Celebration', celebrationSchema);
