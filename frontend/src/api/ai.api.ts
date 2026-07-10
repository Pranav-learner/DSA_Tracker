import { env } from '@/config/env';
import { apiGet, apiSend, ApiError } from './client';
import type {
  Conversation,
  ConversationDetail,
  ChatResult,
  ChatStreamEvent,
  AISettings,
  UpdateAISettingsInput,
  ProvidersResponse,
  AIWorkspaceData,
  SuggestedPrompt,
  ContextPreview,
  AIContext,
  ConversationExport,
  UpdateConversationInput,
  AiIntent,
  ContextProfileName,
} from '@/types';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  provider?: string;
  model?: string;
  /** Slash-command context override. */
  intent?: AiIntent;
  profiles?: ContextProfileName[];
  /** Context sections toggled off in the Context Preview. */
  excludeSections?: string[];
}

/**
 * Parse a Server-Sent-Events stream from POST /ai/chat and dispatch each parsed
 * event to `onEvent`. Streaming is kept out of the JSON `apiGet`/`apiSend` helpers
 * because it reads a ReadableStream rather than a single JSON body.
 */
async function streamChat(
  body: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ ...body, stream: true }),
      signal,
    });
  } catch (cause) {
    if (signal?.aborted) return;
    throw new ApiError(0, 'Network error — is the API server running?', cause);
  }

  if (!res.ok || !res.body) {
    // The server failed before streaming — surface a normal error.
    const detail = await res.json().catch(() => null);
    const message = detail?.error?.message ?? `Chat failed (${res.status})`;
    throw new ApiError(res.status, message, detail?.error?.details);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch {
      // Aborted mid-stream — stop quietly.
      return;
    }
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });

    // SSE events are separated by a blank line.
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (parsed) onEvent(parsed);
    }
  }
}

/** Turn one "event: X\ndata: {...}" block into a typed ChatStreamEvent. */
function parseSseBlock(block: string): ChatStreamEvent | null {
  let event = 'message';
  let data = '';
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data) return null;
  try {
    const payload = JSON.parse(data) as Record<string, unknown>;
    switch (event) {
      case 'start':
        return { type: 'start', conversationId: (payload.conversationId as string) ?? null };
      case 'token':
        return { type: 'token', delta: String(payload.delta ?? '') };
      case 'done':
        return { type: 'done', result: payload as unknown as ChatResult };
      case 'error':
        return { type: 'error', code: String(payload.code ?? 'error'), message: String(payload.message ?? 'AI request failed') };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export const aiApi = {
  streamChat,
  /** Non-streaming chat (fallback when streaming is disabled). */
  chat: (body: ChatRequest) => apiSend<ChatResult>('POST', '/ai/chat', { ...body, stream: false }),

  listConversations: (includeArchived = false, signal?: AbortSignal) =>
    apiGet<Conversation[]>(`/ai/conversations${includeArchived ? '?archived=true' : ''}`, signal),
  getConversation: (id: string, signal?: AbortSignal) => apiGet<ConversationDetail>(`/ai/conversations/${id}`, signal),
  createConversation: (title?: string) => apiSend<Conversation>('POST', '/ai/conversations', { title }),
  updateConversation: (id: string, patch: UpdateConversationInput) => apiSend<Conversation>('PATCH', `/ai/conversations/${id}`, patch),
  deleteConversation: (id: string) => apiSend<{ deleted: boolean }>('DELETE', `/ai/conversations/${id}`),
  searchConversations: (q: string, signal?: AbortSignal) =>
    apiGet<Conversation[]>(`/ai/conversations/search?q=${encodeURIComponent(q)}`, signal),
  exportConversation: (conversationId: string, format: 'markdown' | 'json') =>
    apiSend<ConversationExport>('POST', '/ai/conversations/export', { conversationId, format }),

  getSettings: (signal?: AbortSignal) => apiGet<AISettings>('/ai/settings', signal),
  updateSettings: (patch: UpdateAISettingsInput) => apiSend<AISettings>('PATCH', '/ai/settings', patch),

  getProviders: (signal?: AbortSignal) => apiGet<ProvidersResponse>('/ai/providers', signal),

  // --- Sprint 2 ---
  getWorkspace: (signal?: AbortSignal) => apiGet<AIWorkspaceData>('/ai/workspace', signal),
  getSuggestions: (signal?: AbortSignal) => apiGet<SuggestedPrompt[]>('/ai/suggestions', signal),
  getContext: (intent: string, signal?: AbortSignal) => apiGet<AIContext>(`/ai/context?intent=${intent}`, signal),
  getContextPreview: (params: { intent: string; profiles?: string[]; exclude?: string[] }, signal?: AbortSignal) => {
    const q = new URLSearchParams({ intent: params.intent });
    if (params.profiles?.length) q.set('profiles', params.profiles.join(','));
    if (params.exclude?.length) q.set('exclude', params.exclude.join(','));
    return apiGet<ContextPreview>(`/ai/context/preview?${q.toString()}`, signal);
  },
};
