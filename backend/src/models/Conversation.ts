import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

/**
 * Conversation — an AI chat thread owned by a user (Module 7 · Sprint 1, extended
 * in Sprint 2). Messages live in a separate ConversationMessage collection
 * (loaded on demand) so the sidebar list stays lightweight.
 *
 * Sprint 2 adds conversation intelligence: pin/archive state and denormalised
 * metadata (the last turn's intent/provider/model + cumulative token usage) so
 * the sidebar, filters and metadata card need no message join.
 */
export interface IConversation {
  userId: string;
  title: string;
  messageCount: number;
  lastMessageAt: Date | null;
  pinned: boolean;
  archived: boolean;
  /** Denormalised metadata from the most recent assistant turn. */
  lastIntent: string | null;
  lastProvider: string | null;
  lastModel: string | null;
  /** Cumulative tokens across the whole conversation. */
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'New conversation', trim: true },
    messageCount: { type: Number, default: 0, min: 0 },
    lastMessageAt: { type: Date, default: null },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    lastIntent: { type: String, default: null },
    lastProvider: { type: String, default: null },
    lastModel: { type: String, default: null },
    totalTokens: { type: Number, default: 0, min: 0 },
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

/** Recent-first thread list per user. */
conversationSchema.index({ userId: 1, updatedAt: -1 });
/** Pinned-first, archived-filtered sidebar reads. */
conversationSchema.index({ userId: 1, archived: 1, pinned: -1, updatedAt: -1 });

export type ConversationDocument = HydratedDocument<IConversation>;

export const Conversation: Model<IConversation> = model<IConversation>('Conversation', conversationSchema);
