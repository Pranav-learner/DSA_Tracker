import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

/**
 * Conversation — an AI chat thread owned by a user (Module 7 · Sprint 1).
 * Messages live in a separate ConversationMessage collection (loaded on demand)
 * so the sidebar list stays lightweight. `messageCount` / `lastMessageAt` are
 * denormalised for the list view.
 */
export interface IConversation {
  userId: string;
  title: string;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'New conversation', trim: true },
    messageCount: { type: Number, default: 0, min: 0 },
    lastMessageAt: { type: Date, default: null },
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

export type ConversationDocument = HydratedDocument<IConversation>;

export const Conversation: Model<IConversation> = model<IConversation>('Conversation', conversationSchema);
