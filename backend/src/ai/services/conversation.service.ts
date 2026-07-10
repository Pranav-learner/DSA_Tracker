import { conversationRepository, type MessageInput } from '../repositories/conversation.repository.js';
import { generateTitle } from '../prompts/templates.js';
import { ApiError } from '../../utils/ApiError.js';
import { AI_LIMITS } from '../../config/ai.js';
import type { ConversationDocument } from '../../models/Conversation.js';
import type { ConversationMessageDocument } from '../../models/ConversationMessage.js';
import type { ConversationDTO, ConversationDetailDTO, MessageDTO } from '../dto/ai.dto.js';
import type { HistoryTurn } from '../prompts/promptBuilder.service.js';
import type { AiIntent } from '../types/ai.types.js';

function toConversationDTO(doc: ConversationDocument): ConversationDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    messageCount: doc.messageCount,
    lastMessageAt: doc.lastMessageAt ? doc.lastMessageAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toMessageDTO(doc: ConversationMessageDocument): MessageDTO {
  const snap = doc.contextSnapshot as { intent?: AiIntent; sections?: { key: string; title: string }[] } | null;
  return {
    id: String(doc._id),
    role: doc.role,
    content: doc.content,
    provider: doc.provider,
    model: doc.model,
    usage: { promptTokens: doc.promptTokens, completionTokens: doc.completionTokens, totalTokens: doc.totalTokens },
    responseTime: doc.responseTime,
    context: snap?.intent ? { intent: snap.intent, sections: snap.sections ?? [] } : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * ConversationService — the AI module's own conversation storage (CRUD + message
 * persistence). All reads are scoped by `userId`; a mismatched id yields 404, so
 * conversation ownership is enforced here (no cross-user access path).
 */
export const conversationService = {
  async list(userId: string): Promise<ConversationDTO[]> {
    const docs = await conversationRepository.findByUser(userId);
    return docs.map(toConversationDTO);
  },

  async get(userId: string, id: string): Promise<ConversationDetailDTO> {
    const conv = await this.requireOwned(userId, id);
    const messages = await conversationRepository.findMessages(id);
    return { ...toConversationDTO(conv), messages: messages.map(toMessageDTO) };
  },

  async create(userId: string, title?: string): Promise<ConversationDTO> {
    const doc = await conversationRepository.create(userId, title?.trim() || 'New conversation');
    return toConversationDTO(doc);
  },

  async rename(userId: string, id: string, title: string): Promise<ConversationDTO> {
    await this.requireOwned(userId, id);
    const doc = await conversationRepository.update(userId, id, { title: title.trim() || 'New conversation' });
    return toConversationDTO(doc!);
  },

  async remove(userId: string, id: string): Promise<void> {
    const removed = await conversationRepository.remove(userId, id);
    if (!removed) throw ApiError.notFound('Conversation not found');
  },

  /** Ensure a conversation exists and belongs to the user (else 404). */
  async requireOwned(userId: string, id: string): Promise<ConversationDocument> {
    const doc = await conversationRepository.findById(userId, id);
    if (!doc) throw ApiError.notFound('Conversation not found');
    return doc;
  },

  /** Resolve the target conversation for a chat turn, creating one if needed. */
  async resolveForChat(userId: string, conversationId: string | undefined, firstMessage: string): Promise<ConversationDocument> {
    if (conversationId) return this.requireOwned(userId, conversationId);
    return conversationRepository.create(userId, generateTitle(firstMessage));
  },

  /** The recent history window for a conversation, as prompt turns. */
  async history(conversationId: string): Promise<HistoryTurn[]> {
    const docs = await conversationRepository.recentMessages(conversationId, AI_LIMITS.historyWindow);
    return docs
      .filter((d) => d.role === 'user' || d.role === 'assistant')
      .map((d) => ({ role: d.role as 'user' | 'assistant', content: d.content }));
  },

  /** Persist a message and bump the conversation counters. */
  async appendMessage(input: MessageInput): Promise<ConversationMessageDocument> {
    const doc = await conversationRepository.addMessage(input);
    await conversationRepository.touch(String(input.conversationId), 1, doc.createdAt);
    return doc;
  },

  toMessageDTO,
  toConversationDTO,
};
