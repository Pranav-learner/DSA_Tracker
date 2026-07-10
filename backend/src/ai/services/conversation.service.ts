import { conversationRepository, type MessageInput } from '../repositories/conversation.repository.js';
import { generateTitle } from '../prompts/templates.js';
import { ApiError } from '../../utils/ApiError.js';
import { AI_LIMITS } from '../../config/ai.js';
import type { ConversationDocument } from '../../models/Conversation.js';
import type { ConversationMessageDocument } from '../../models/ConversationMessage.js';
import type { ConversationDTO, ConversationDetailDTO, MessageDTO, ConversationExportDTO } from '../dto/ai.dto.js';
import type { HistoryTurn } from '../prompts/promptBuilder.service.js';
import type { AiIntent } from '../types/ai.types.js';

function toConversationDTO(doc: ConversationDocument): ConversationDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    messageCount: doc.messageCount,
    lastMessageAt: doc.lastMessageAt ? doc.lastMessageAt.toISOString() : null,
    pinned: doc.pinned,
    archived: doc.archived,
    lastIntent: doc.lastIntent,
    lastProvider: doc.lastProvider,
    lastModel: doc.lastModel,
    totalTokens: doc.totalTokens,
    tags: doc.tags ?? [],
    summary: doc.summary ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toMessageDTO(doc: ConversationMessageDocument): MessageDTO {
  const snap = doc.contextSnapshot as
    | { intent?: AiIntent; profiles?: string[]; sections?: { key: string; title: string }[] }
    | null;
  return {
    id: String(doc._id),
    role: doc.role,
    content: doc.content,
    provider: doc.provider,
    model: doc.model,
    usage: { promptTokens: doc.promptTokens, completionTokens: doc.completionTokens, totalTokens: doc.totalTokens },
    responseTime: doc.responseTime,
    context: snap?.intent ? { intent: snap.intent, profiles: snap.profiles ?? [], sections: snap.sections ?? [] } : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * ConversationService — the AI module's own conversation storage (CRUD + message
 * persistence). All reads are scoped by `userId`; a mismatched id yields 404, so
 * conversation ownership is enforced here (no cross-user access path).
 */
export const conversationService = {
  async list(userId: string, opts: { includeArchived?: boolean } = {}): Promise<ConversationDTO[]> {
    const docs = await conversationRepository.findByUser(userId, opts);
    return docs.map(toConversationDTO);
  },

  /** Full-text-ish search across the user's conversations (title + content). */
  async search(userId: string, query: string): Promise<ConversationDTO[]> {
    const q = query.trim();
    if (!q) return [];
    const docs = await conversationRepository.search(userId, q);
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
    return this.update(userId, id, { title: title.trim() || 'New conversation' });
  },

  /** Patch a conversation: rename, pin/unpin, archive/unarchive, tag. */
  async update(
    userId: string,
    id: string,
    patch: { title?: string; pinned?: boolean; archived?: boolean; tags?: string[] },
  ): Promise<ConversationDTO> {
    await this.requireOwned(userId, id);
    const clean: Record<string, unknown> = {};
    if (patch.title !== undefined) clean.title = patch.title.trim() || 'New conversation';
    if (patch.pinned !== undefined) clean.pinned = patch.pinned;
    if (patch.archived !== undefined) clean.archived = patch.archived;
    if (patch.tags !== undefined) clean.tags = [...new Set(patch.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
    const doc = await conversationRepository.update(userId, id, clean);
    return toConversationDTO(doc!);
  },

  /**
   * Compress a conversation into a short, learning-scoped summary (Sprint 4).
   * Deterministic and rule-based (no LLM) — the opening question, the turn count
   * and the dominant intent — so it's always available and cheap. Persisted so the
   * ConversationSummaryCard and relevant-history retrieval can reuse it.
   */
  async summarize(userId: string, id: string): Promise<ConversationDTO> {
    const conv = await this.requireOwned(userId, id);
    const messages = await conversationRepository.findMessages(id);
    const firstUser = messages.find((m) => m.role === 'user')?.content ?? '';
    const opening = firstUser.replace(/\s+/g, ' ').trim().slice(0, 140);
    const turns = messages.filter((m) => m.role === 'user' || m.role === 'assistant').length;
    const summary =
      [opening ? `Started with: “${opening}”.` : '', `${turns} turns${conv.lastIntent ? ` · focus: ${conv.lastIntent}` : ''}.`]
        .filter(Boolean)
        .join(' ') || 'Empty conversation.';
    const doc = await conversationRepository.update(userId, id, { summary });
    return toConversationDTO(doc!);
  },

  /** Update denormalised per-conversation metadata after an assistant turn. */
  async recordTurnMeta(
    conversationId: string,
    meta: { intent: string; provider: string | null; model: string | null; tokens: number },
  ): Promise<void> {
    await conversationRepository.recordTurnMeta(conversationId, meta);
  },

  /**
   * Export a conversation as Markdown or JSON. Deliberately LIMITS the exported
   * data: only role, content and timestamps (plus light assistant metadata) —
   * never the internal context snapshot or system prompt.
   */
  async export(userId: string, id: string, format: 'markdown' | 'json'): Promise<ConversationExportDTO> {
    const conv = await this.requireOwned(userId, id);
    const messages = await conversationRepository.findMessages(id);
    const turns = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        ...(m.role === 'assistant' ? { provider: m.provider, model: m.model } : {}),
      }));

    const slug = conv.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'conversation';

    if (format === 'json') {
      return {
        filename: `${slug}.json`,
        format,
        contentType: 'application/json',
        content: JSON.stringify({ title: conv.title, exportedAt: new Date().toISOString(), messages: turns }, null, 2),
      };
    }

    const md = [
      `# ${conv.title}`,
      ``,
      `_Exported ${new Date().toISOString()} · ${turns.length} messages_`,
      ``,
      ...turns.map((t) => `## ${t.role === 'user' ? 'You' : 'Mentor'}\n\n${t.content}`),
    ].join('\n');
    return { filename: `${slug}.md`, format, contentType: 'text/markdown', content: md };
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
