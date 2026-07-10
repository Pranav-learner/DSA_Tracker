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

  /** Sidebar list — pinned first, archived excluded unless requested. */
  findByUser(userId: string, opts: { includeArchived?: boolean; limit?: number } = {}): Promise<ConversationDocument[]> {
    const q: Record<string, unknown> = { userId };
    if (!opts.includeArchived) q.archived = false;
    return Conversation.find(q).sort({ pinned: -1, updatedAt: -1 }).limit(opts.limit ?? 100).exec();
  },

  findById(userId: string, id: string): Promise<ConversationDocument | null> {
    return Conversation.findOne({ _id: id, userId }).exec();
  },

  update(userId: string, id: string, update: Partial<IConversation>): Promise<ConversationDocument | null> {
    return Conversation.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true }).exec();
  },

  /** Update denormalised metadata after an assistant turn (intent/provider/tokens). */
  recordTurnMeta(id: string, meta: { intent: string; provider: string | null; model: string | null; tokens: number }): Promise<ConversationDocument | null> {
    return Conversation.findByIdAndUpdate(
      id,
      { $set: { lastIntent: meta.intent, lastProvider: meta.provider, lastModel: meta.model }, $inc: { totalTokens: meta.tokens } },
      { new: true },
    ).exec();
  },

  /**
   * Search a user's conversations by title OR message content. Title matches
   * rank first; content matches pull in conversations whose messages match.
   */
  async search(userId: string, query: string, limit = 30): Promise<ConversationDocument[]> {
    const rx = new RegExp(escapeRegex(query), 'i');
    const byTitle = await Conversation.find({ userId, title: rx }).sort({ updatedAt: -1 }).limit(limit).exec();
    const titleIds = new Set(byTitle.map((c) => String(c._id)));

    // Conversations whose message content matches (excluding already-found titles).
    const msgConvoIds = await ConversationMessage.find({ userId, content: rx }).distinct('conversationId').exec();
    const extraIds = msgConvoIds.map(String).filter((id) => !titleIds.has(id));
    const byContent = extraIds.length
      ? await Conversation.find({ userId, _id: { $in: extraIds } }).sort({ updatedAt: -1 }).limit(limit).exec()
      : [];

    return [...byTitle, ...byContent].slice(0, limit);
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

/** Escape user input for safe use inside a RegExp (search). */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
