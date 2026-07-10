import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { aiApi } from '@/api/ai.api';
import { queryKeys } from '@/lib/queryClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  startStreaming,
  appendStreamToken,
  finishStreaming,
  streamError,
  setActiveContext,
  setCoachResponse,
} from '@/store/slices/aiSlice';
import type { UpdateAISettingsInput, UpdateConversationInput, AiIntent, ContextProfileName } from '@/types';

/**
 * Server state for the AI mentor. Conversations, messages, settings, provider
 * metadata, the workspace snapshot, suggestions and the context preview are owned
 * by React Query; the live streaming state lives in Redux (aiSlice). Provider
 * metadata and context profiles are cached aggressively (rarely change).
 */

export function useConversations(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.aiConversations(includeArchived),
    queryFn: ({ signal }) => aiApi.listConversations(includeArchived, signal),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.aiConversation(id) : ['ai', 'conversations', 'detail', 'none'],
    queryFn: ({ signal }) => aiApi.getConversation(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Debounced conversation search (title + message content). Enabled once q is non-trivial. */
export function useConversationSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: queryKeys.aiConversationSearch(query),
    queryFn: ({ signal }) => aiApi.searchConversations(query, signal),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
  });
}

export function useAISettings() {
  return useQuery({
    queryKey: queryKeys.aiSettings,
    queryFn: ({ signal }) => aiApi.getSettings(signal),
  });
}

export function useAIProviders() {
  return useQuery({
    queryKey: queryKeys.aiProviders,
    queryFn: ({ signal }) => aiApi.getProviders(signal),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/** The AI Mentor landing read-model: snapshot + suggestions + recents + recommendation + quick actions. */
export function useAIWorkspace() {
  return useQuery({
    queryKey: queryKeys.aiWorkspace,
    queryFn: ({ signal }) => aiApi.getWorkspace(signal),
    staleTime: 30_000,
  });
}

/** Personalised prompt suggestions from the learner's current progress. */
export function useAISuggestions() {
  return useQuery({
    queryKey: queryKeys.aiSuggestions,
    queryFn: ({ signal }) => aiApi.getSuggestions(signal),
    staleTime: 60_000,
  });
}

/**
 * The Context Preview for a given intent/profiles/excluded set — the candidate
 * sections with included/optional flags and token sizes. Cached per param set.
 */
export function useContextPreview(params: { intent: string; profiles?: string[]; exclude?: string[] }, enabled = true) {
  return useQuery({
    queryKey: queryKeys.aiContextPreview(params),
    queryFn: ({ signal }) => aiApi.getContextPreview(params, signal),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateAISettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateAISettingsInput) => aiApi.updateSettings(patch),
    onSuccess: (settings) => {
      qc.setQueryData(queryKeys.aiSettings, settings);
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => aiApi.createConversation(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.aiConversationsRoot }),
  });
}

/** Rename / pin / archive a conversation (PATCH /conversations/:id). */
export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateConversationInput }) => aiApi.updateConversation(id, patch),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.aiConversationsRoot });
      qc.invalidateQueries({ queryKey: queryKeys.aiConversation(id) });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.aiConversationsRoot }),
  });
}

/** Export a conversation as markdown/json (returns the payload; caller triggers the download). */
export function useExportConversation() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: 'markdown' | 'json' }) => aiApi.exportConversation(id, format),
  });
}

/** Options a chat turn can carry — layered on top of the Redux context selections. */
export interface SendOptions {
  provider?: string;
  model?: string;
  intent?: AiIntent;
  profiles?: ContextProfileName[];
  excludeSections?: string[];
  /** Coach mode: pin the turn to a specific coach (else resolved by intent). */
  coachId?: string;
}

/** Coach registry metadata (cached — rarely changes). */
export function useCoaches() {
  return useQuery({
    queryKey: queryKeys.aiCoaches,
    queryFn: ({ signal }) => aiApi.listCoaches(signal),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/** A single coach's metadata. */
export function useCoach(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.aiCoach(id) : ['ai', 'coaches', 'none'],
    queryFn: ({ signal }) => aiApi.getCoach(id as string, signal),
    enabled: Boolean(id),
    staleTime: 10 * 60_000,
  });
}

/**
 * useChatStream — drives a streaming chat turn: sends the message with the active
 * context selections (slash-command intent/profiles + Context-Preview toggles),
 * pushes each SSE event into the Redux streaming state, and on completion
 * refreshes the conversation from the server (so persisted messages replace the
 * optimistic ones). Exposes `stop()` to abort mid-stream. All server writes stay
 * on the backend; this hook only orchestrates UI + cache.
 */
export function useChatStream() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const conversationId = useAppSelector((s) => s.ai.currentConversationId);
  const isStreaming = useAppSelector((s) => s.ai.isStreaming);
  const activeCommand = useAppSelector((s) => s.ai.activeCommand);
  const excludedSections = useAppSelector((s) => s.ai.excludedSections);
  const controllerRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (message: string, override: SendOptions = {}) => {
      const trimmed = message.trim();
      if (!trimmed || isStreaming) return;

      dispatch(startStreaming(trimmed));
      const controller = new AbortController();
      controllerRef.current = controller;

      // Layer the request: explicit override wins, else the active slash command's
      // intent/profiles, else let the backend classify. Excluded sections always
      // reflect the current Context-Preview toggles.
      const intent = override.intent ?? activeCommand?.intent;
      const profiles = override.profiles ?? activeCommand?.profiles;
      const excludeSections = override.excludeSections ?? (excludedSections.length ? excludedSections : undefined);

      try {
        await aiApi.streamChat(
          {
            message: trimmed,
            conversationId: conversationId ?? undefined,
            provider: override.provider,
            model: override.model,
            intent,
            profiles,
            excludeSections,
          },
          (event) => {
            if (event.type === 'token') dispatch(appendStreamToken(event.delta));
            else if (event.type === 'done') {
              dispatch(
                setActiveContext({
                  intent: event.result.intent,
                  sections: event.result.contextSections.map((s) => ({ key: s.key, title: s.title })),
                }),
              );
              dispatch(finishStreaming({ conversationId: event.result.conversationId }));
              qc.invalidateQueries({ queryKey: queryKeys.aiConversationsRoot });
              qc.invalidateQueries({ queryKey: queryKeys.aiConversation(event.result.conversationId) });
              qc.invalidateQueries({ queryKey: queryKeys.aiWorkspace });
            } else if (event.type === 'error') {
              dispatch(streamError(event.message));
            }
          },
          controller.signal,
        );
      } catch (err) {
        dispatch(streamError(err instanceof Error ? err.message : 'AI request failed'));
      } finally {
        controllerRef.current = null;
      }
    },
    [conversationId, dispatch, isStreaming, qc, activeCommand, excludedSections],
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch(finishStreaming(undefined));
    // Refresh so any partial assistant text the server persisted shows up.
    qc.invalidateQueries({ queryKey: queryKeys.aiConversationsRoot });
    if (conversationId) qc.invalidateQueries({ queryKey: queryKeys.aiConversation(conversationId) });
  }, [conversationId, dispatch, qc]);

  return { send, stop };
}

/**
 * useCoachStream — a streaming turn against a SPECIALIZED coach (POST /ai/coach).
 * Mirrors useChatStream (same Redux streaming state), but on completion it also
 * stores the STRUCTURED coach response (recommendations, actions, confidence, …)
 * so the CoachResponse card can render it. The coach is pinned by `selectedCoachId`
 * (or the `coachId` override), else the backend resolves it by intent.
 */
export function useCoachStream() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const conversationId = useAppSelector((s) => s.ai.currentConversationId);
  const isStreaming = useAppSelector((s) => s.ai.isStreaming);
  const selectedCoachId = useAppSelector((s) => s.ai.selectedCoachId);
  const excludedSections = useAppSelector((s) => s.ai.excludedSections);
  const controllerRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (message: string, override: SendOptions = {}) => {
      const trimmed = message.trim();
      if (!trimmed || isStreaming) return;

      dispatch(startStreaming(trimmed));
      dispatch(setCoachResponse(null));
      const controller = new AbortController();
      controllerRef.current = controller;

      const coachId = override.coachId ?? selectedCoachId ?? undefined;
      const excludeSections = override.excludeSections ?? (excludedSections.length ? excludedSections : undefined);

      try {
        await aiApi.streamCoach(
          {
            message: trimmed,
            coachId,
            intent: override.intent,
            conversationId: conversationId ?? undefined,
            provider: override.provider,
            model: override.model,
            excludeSections,
          },
          (event) => {
            if (event.type === 'token') dispatch(appendStreamToken(event.delta));
            else if (event.type === 'done') {
              dispatch(
                setActiveContext({
                  intent: event.result.intent,
                  sections: event.result.contextSections.map((s) => ({ key: s.key, title: s.title })),
                }),
              );
              dispatch(setCoachResponse(event.result));
              dispatch(finishStreaming({ conversationId: event.result.conversationId }));
              qc.invalidateQueries({ queryKey: queryKeys.aiConversationsRoot });
              qc.invalidateQueries({ queryKey: queryKeys.aiConversation(event.result.conversationId) });
              qc.invalidateQueries({ queryKey: queryKeys.aiWorkspace });
            } else if (event.type === 'error') {
              dispatch(streamError(event.message));
            }
          },
          controller.signal,
        );
      } catch (err) {
        dispatch(streamError(err instanceof Error ? err.message : 'Coach request failed'));
      } finally {
        controllerRef.current = null;
      }
    },
    [conversationId, dispatch, isStreaming, qc, selectedCoachId, excludedSections],
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch(finishStreaming(undefined));
    qc.invalidateQueries({ queryKey: queryKeys.aiConversationsRoot });
    if (conversationId) qc.invalidateQueries({ queryKey: queryKeys.aiConversation(conversationId) });
  }, [conversationId, dispatch, qc]);

  return { send, stop };
}

/**
 * useMentor — the single send/stop entry point the workspace uses. Routes to the
 * specialized coach pipeline when the workspace is in coach mode, else the generic
 * mentor chat. Both share the same Redux streaming state, so the UI is identical.
 */
export function useMentor() {
  const mode = useAppSelector((s) => s.ai.conversationMode);
  const chat = useChatStream();
  const coach = useCoachStream();
  const active = mode === 'coach' ? coach : chat;
  return { send: active.send, stop: active.stop, mode };
}

/* ------------------------------------------------------------------ *
 *  Sprint 4 — AI Operating System
 * ------------------------------------------------------------------ */

/** The AI OS dashboard header (brief + workflows + recommendations + actions). */
export function useMentorOverview() {
  return useQuery({
    queryKey: queryKeys.aiOverview,
    queryFn: ({ signal }) => aiApi.getOverview(signal),
    staleTime: 60_000,
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: queryKeys.aiWorkflows,
    queryFn: ({ signal }) => aiApi.getWorkflows(signal),
    staleTime: 60_000,
  });
}

export function useGenerateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, save }: { key: import('@/types').WorkflowKey; save?: boolean }) => aiApi.generateWorkflow(key, save),
    onSuccess: (_data, { save }) => {
      if (save) {
        qc.invalidateQueries({ queryKey: queryKeys.aiWorkflows });
        qc.invalidateQueries({ queryKey: queryKeys.aiOverview });
      }
    },
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: import('@/types').WorkflowStatus }) => aiApi.updateWorkflow(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.aiWorkflows });
      qc.invalidateQueries({ queryKey: queryKeys.aiOverview });
    },
  });
}

/** The recommendation center. `status` filters; omit to generate + list active. */
export function useRecommendations(status?: import('@/types').RecommendationStatus) {
  return useQuery({
    queryKey: queryKeys.aiRecommendations(status),
    queryFn: ({ signal }) => aiApi.getRecommendations(status, signal),
    staleTime: 30_000,
  });
}

export function useUpdateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: import('@/types').RecommendationStatus }) => aiApi.updateRecommendation(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'recommendations'] });
      qc.invalidateQueries({ queryKey: queryKeys.aiOverview });
    },
  });
}

export function useMentorBrief(kind: import('@/types').BriefKind = 'daily') {
  return useQuery({
    queryKey: queryKeys.aiMentorBrief(kind),
    queryFn: ({ signal }) => aiApi.getMentorBrief(kind, signal),
    staleTime: 5 * 60_000,
  });
}

export function useTimeline(params: { q?: string; types?: import('@/types').TimelineEntryType[]; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.aiTimeline(params),
    queryFn: ({ signal }) => aiApi.getTimeline(params, signal),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useMentorActions() {
  return useQuery({
    queryKey: queryKeys.aiActions,
    queryFn: ({ signal }) => aiApi.getActions(signal),
    staleTime: 60_000,
  });
}

export function useSummarizeConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.summarizeConversation(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.aiConversation(id) });
      qc.invalidateQueries({ queryKey: queryKeys.aiConversationsRoot });
    },
  });
}
