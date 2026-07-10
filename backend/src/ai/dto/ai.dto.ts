import type { ChatRole, AiIntent, ProviderId, ProviderInfo, AIContextSection } from '../types/ai.types.js';

/** A conversation in the sidebar list. */
export interface ConversationDTO {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A single stored message (with telemetry for assistant turns). */
export interface MessageDTO {
  id: string;
  role: ChatRole;
  content: string;
  provider: string | null;
  model: string | null;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  responseTime: number;
  /** The context sections used (assistant turns) — for the UI context indicator. */
  context: { intent: AiIntent; sections: { key: string; title: string }[] } | null;
  createdAt: string;
}

/** A conversation plus its full message list. */
export interface ConversationDetailDTO extends ConversationDTO {
  messages: MessageDTO[];
}

/** The non-streaming chat result. */
export interface ChatResultDTO {
  conversationId: string;
  intent: AiIntent;
  provider: ProviderId;
  /** True when the requested provider was unavailable and the gateway fell back. */
  fellBack: boolean;
  contextSections: AIContextSection[];
  userMessage: MessageDTO;
  assistantMessage: MessageDTO;
}

/** AI preferences returned by GET /settings. */
export interface AISettingsDTO {
  preferredProvider: ProviderId;
  preferredModel: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
  updatedAt: string | null;
}

/** GET /providers payload. */
export interface ProvidersDTO {
  providers: ProviderInfo[];
  defaultProvider: ProviderId;
}
