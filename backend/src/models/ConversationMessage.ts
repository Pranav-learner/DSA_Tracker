import { Schema, model, Types, type HydratedDocument, type Model } from 'mongoose';
import { CHAT_ROLES, type ChatRole } from '../ai/types/ai.types.js';

/**
 * ConversationMessage — a single turn in a Conversation (Module 7 · Sprint 1).
 *
 * Rich metadata is stored deliberately (provider/model/token usage/response time
 * + the context snapshot used) so future sprints can build AI analytics without
 * a schema change. `userId` is denormalised for cheap ownership scoping.
 * `createdAt` is explicit (messages are immutable — no updatedAt).
 */
export interface IConversationMessage {
  conversationId: Types.ObjectId;
  userId: string;
  role: ChatRole;
  content: string;
  /** The structured context assembled for this turn (assistant turns only). */
  contextSnapshot: Record<string, unknown> | null;
  provider: string | null;
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Provider response time in ms (assistant turns). */
  responseTime: number;
  createdAt: Date;
}

const conversationMessageSchema = new Schema<IConversationMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: CHAT_ROLES, required: true },
    content: { type: String, default: '' },
    contextSnapshot: { type: Schema.Types.Mixed, default: null },
    provider: { type: String, default: null },
    model: { type: String, default: null },
    promptTokens: { type: Number, default: 0, min: 0 },
    completionTokens: { type: Number, default: 0, min: 0 },
    totalTokens: { type: Number, default: 0, min: 0 },
    responseTime: { type: Number, default: 0, min: 0 },
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

/** Chronological message load per conversation. */
conversationMessageSchema.index({ conversationId: 1, createdAt: 1 });

export type ConversationMessageDocument = HydratedDocument<IConversationMessage>;

export const ConversationMessage: Model<IConversationMessage> = model<IConversationMessage>(
  'ConversationMessage',
  conversationMessageSchema,
);
