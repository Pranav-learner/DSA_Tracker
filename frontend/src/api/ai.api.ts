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
  CoachesResponse,
  CoachMeta,
  CoachResponse,
  CoachStreamEvent,
} from '@/types';

export interface CoachRequest {
  message: string;
  /** Explicit coach id (from the coach selector); else resolved from intent. */
  coachId?: string;
  intent?: AiIntent;
  conversationId?: string;
  provider?: string;
  model?: string;
  excludeSections?: string[];
}

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
 * Read a Server-Sent-Events stream from a POST endpoint, handing each raw event
 * block to `onBlock`. Shared by chat and coach streaming — kept out of the JSON
 * `apiGet`/`apiSend` helpers because it reads a ReadableStream, not one JSON body.
 */
async function readSse(
  path: string,
  body: Record<string, unknown>,
  onBlock: (block: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
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
    const message = detail?.error?.message ?? `Request failed (${res.status})`;
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
    for (const block of blocks) onBlock(block);
  }
}

/** Split one "event: X\ndata: {...}" block into its event name + parsed JSON. */
function parseSseFields(block: string): { event: string; payload: Record<string, unknown> } | null {
  let event = 'message';
  let data = '';
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data) return null;
  try {
    return { event, payload: JSON.parse(data) as Record<string, unknown> };
  } catch {
    return null;
  }
}

/** Stream POST /ai/chat, dispatching each parsed event to `onEvent`. */
async function streamChat(body: ChatRequest, onEvent: (event: ChatStreamEvent) => void, signal?: AbortSignal): Promise<void> {
  await readSse(
    '/ai/chat',
    body as unknown as Record<string, unknown>,
    (block) => {
      const parsed = parseSseFields(block);
      if (!parsed) return;
      const { event, payload } = parsed;
      if (event === 'start') onEvent({ type: 'start', conversationId: (payload.conversationId as string) ?? null });
      else if (event === 'token') onEvent({ type: 'token', delta: String(payload.delta ?? '') });
      else if (event === 'done') onEvent({ type: 'done', result: payload as unknown as ChatResult });
      else if (event === 'error') onEvent({ type: 'error', code: String(payload.code ?? 'error'), message: String(payload.message ?? 'AI request failed') });
    },
    signal,
  );
}

/** Stream POST /ai/coach, dispatching each parsed event to `onEvent`. */
async function streamCoach(body: CoachRequest, onEvent: (event: CoachStreamEvent) => void, signal?: AbortSignal): Promise<void> {
  await readSse(
    '/ai/coach',
    body as unknown as Record<string, unknown>,
    (block) => {
      const parsed = parseSseFields(block);
      if (!parsed) return;
      const { event, payload } = parsed;
      if (event === 'start')
        onEvent({ type: 'start', conversationId: (payload.conversationId as string) ?? null, coachId: String(payload.coachId ?? ''), intent: payload.intent as AiIntent });
      else if (event === 'token') onEvent({ type: 'token', delta: String(payload.delta ?? '') });
      else if (event === 'done') onEvent({ type: 'done', result: payload as unknown as CoachResponse });
      else if (event === 'error') onEvent({ type: 'error', code: String(payload.code ?? 'error'), message: String(payload.message ?? 'Coach request failed') });
    },
    signal,
  );
}

export const aiApi = {
  streamChat,
  /** Non-streaming chat (fallback when streaming is disabled). */
  chat: (body: ChatRequest) => apiSend<ChatResult>('POST', '/ai/chat', { ...body, stream: false }),

  // --- Sprint 3: coaching ---
  streamCoach,
  /** Non-streaming coach turn (fallback when streaming is disabled). */
  coach: (body: CoachRequest) => apiSend<CoachResponse>('POST', '/ai/coach', { ...body, stream: false }),
  listCoaches: (signal?: AbortSignal) => apiGet<CoachesResponse>('/ai/coaches', signal),
  getCoach: (id: string, signal?: AbortSignal) => apiGet<CoachMeta>(`/ai/coaches/${id}`, signal),

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
