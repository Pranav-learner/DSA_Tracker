import type { ChatRole, AiIntent, ProviderId, ProviderInfo, AIContextSection, ContextProfileName } from '../types/ai.types.js';

/** A conversation in the sidebar list (with Sprint 2 metadata). */
export interface ConversationDTO {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  pinned: boolean;
  archived: boolean;
  lastIntent: string | null;
  lastProvider: string | null;
  lastModel: string | null;
  totalTokens: number;
  /** Sprint 4 — conversation continuity. */
  tags: string[];
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A conversation export payload (limited, sanitised data). */
export interface ConversationExportDTO {
  filename: string;
  format: 'markdown' | 'json';
  contentType: string;
  content: string;
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
  context: { intent: AiIntent; profiles: string[]; sections: { key: string; title: string }[] } | null;
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
  profiles: ContextProfileName[];
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

/* ------------------------------------------------------------------ *
 *  Sprint 2 — Workspace · Learning Snapshot · Suggestions
 * ------------------------------------------------------------------ */

/** The auto-updating Learning Snapshot panel. */
export interface LearningSnapshotDTO {
  currentPhase: string | null;
  currentTopic: string | null;
  mastery: number;
  revisionDue: number;
  weakestPattern: string | null;
  strongestPattern: string | null;
  currentStreak: number;
  contestReadiness: number | null;
  recommendation: { title: string; message: string; actionLabel: string; actionTo: string } | null;
}

/** A personalised, one-tap prompt suggestion. */
export interface SuggestedPromptDTO {
  id: string;
  text: string;
  intent: AiIntent;
  /** Slash command that best fits this prompt (preselects the context profile). */
  command: string | null;
  /** Why this was suggested (from the learner's current state). */
  reason: string;
}

/** A quick mentor action (a slash command surfaced as a button). */
export interface QuickActionDTO {
  command: string;
  label: string;
  intent: AiIntent;
}

/** GET /workspace — everything the AI Mentor landing needs in one call. */
export interface WorkspaceDTO {
  snapshot: LearningSnapshotDTO;
  suggestions: SuggestedPromptDTO[];
  recentConversations: ConversationDTO[];
  recommendation: LearningSnapshotDTO['recommendation'];
  quickActions: QuickActionDTO[];
}
