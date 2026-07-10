import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { PROVIDER_IDS, type ProviderId } from '../ai/types/ai.types.js';

/**
 * AISettings — a user's AI preferences (Module 7 · Sprint 1). One row per user;
 * these override the platform defaults per request. No secrets are stored here —
 * provider credentials live server-side in config, never per-user.
 */
export interface IAISettings {
  userId: string;
  preferredProvider: ProviderId;
  preferredModel: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const aiSettingsSchema = new Schema<IAISettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    preferredProvider: { type: String, enum: PROVIDER_IDS, required: true },
    preferredModel: { type: String, required: true },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 1024, min: 64, max: 8192 },
    streamingEnabled: { type: Boolean, default: true },
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

export type AISettingsDocument = HydratedDocument<IAISettings>;

export const AISettings: Model<IAISettings> = model<IAISettings>('AISettings', aiSettingsSchema);
