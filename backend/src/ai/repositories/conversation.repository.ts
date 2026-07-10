import { Conversation, type ConversationDocument, type IConversation } from '../../models/Conversation.js';
import { ConversationMessage, type ConversationMessageDocument, type IConversationMessage } from '../../models/ConversationMessage.js';

export type MessageInput = Omit<IConversationMessage, 'createdAt'> & { createdAt?: Date };

/**
 * Conversation repository — sole owner of Conversation + ConversationMessage
 * MongoDB operations. Every read is scoped by `userId` so a user can only ever
 * touch their own threads (ownership enforced at the data layer).
 */
export const conversationRepository = {
  /* -- Conversations -- */
  create(userId: string, title: string): Promise<ConversationDocument> {
    return Conversation.create({ userId, title });
  },

  findByUser(userId: string, limit = 50): Promise<ConversationDocument[]> {
    return Conversation.find({ userId }).sort({ updatedAt: -1 }).limit(limit).exec();
  },

  findById(userId: string, id: string): Promise<ConversationDocument | null> {
    return Conversation.findOne({ _id: id, userId }).exec();
  },

  update(userId: string, id: string, update: Partial<IConversation>): Promise<ConversationDocument | null> {
    return Conversation.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true }).exec();
  },

  /** Bump message count + timestamps after a turn is appended. */
  touch(id: string, addedMessages: number, at: Date): Promise<ConversationDocument | null> {
    return Conversation.findByIdAndUpdate(
      id,
      { $inc: { messageCount: addedMessages }, $set: { lastMessageAt: at, updatedAt: at } },
      { new: true },
    ).exec();
  },

  async remove(userId: string, id: string): Promise<boolean> {
    const res = await Conversation.deleteOne({ _id: id, userId }).exec();
    if (res.deletedCount) await ConversationMessage.deleteMany({ conversationId: id }).exec();
    return Boolean(res.deletedCount);
  },

  /* -- Messages -- */
  addMessage(input: MessageInput): Promise<ConversationMessageDocument> {
    return ConversationMessage.create(input);
  },

  /** Messages for a conversation, chronological. `limit`/`before` enable paging. */
  findMessages(conversationId: string, opts: { limit?: number } = {}): Promise<ConversationMessageDocument[]> {
    return ConversationMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(opts.limit ?? 500)
      .exec();
  },

  /** The most recent N messages (for the history window fed to the LLM). */
  async recentMessages(conversationId: string, limit: number): Promise<ConversationMessageDocument[]> {
    const docs = await ConversationMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.reverse();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return Promise.all([
      Conversation.deleteMany({ userId }).exec(),
      ConversationMessage.deleteMany({ userId }).exec(),
    ]);
  },
};
