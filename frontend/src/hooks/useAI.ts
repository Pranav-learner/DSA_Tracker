import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai.api';
import { queryKeys } from '@/lib/queryClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  startStreaming,
  appendStreamToken,
  finishStreaming,
  streamError,
  setActiveContext,
} from '@/store/slices/aiSlice';
import type { UpdateAISettingsInput } from '@/types';

/**
 * Server state for the AI mentor. Conversations, messages, settings and provider
 * metadata are owned by React Query; the live streaming state lives in Redux
 * (aiSlice). Provider metadata is cached aggressively (rarely changes).
 */

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.aiConversations,
    queryFn: ({ signal }) => aiApi.listConversations(signal),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.aiConversation(id) : ['ai', 'conversations', 'none'],
    queryFn: ({ signal }) => aiApi.getConversation(id as string, signal),
    enabled: Boolean(id),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.aiConversations }),
  });
}

export function useRenameConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => aiApi.renameConversation(id, title),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.aiConversations });
      qc.invalidateQueries({ queryKey: queryKeys.aiConversation(id) });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.aiConversations }),
  });
}

/**
 * useChatStream — drives a streaming chat turn: sends the message, pushes each
 * SSE event into the Redux streaming state, and on completion refreshes the
 * conversation from the server (so the persisted messages replace the optimistic
 * ones). Exposes `stop()` to abort mid-stream. All server writes stay on the
 * backend; this hook only orchestrates UI + cache.
 */
export function useChatStream() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const conversationId = useAppSelector((s) => s.ai.currentConversationId);
  const isStreaming = useAppSelector((s) => s.ai.isStreaming);
  const controllerRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (message: string, override?: { provider?: string; model?: string }) => {
      const trimmed = message.trim();
      if (!trimmed || isStreaming) return;

      dispatch(startStreaming(trimmed));
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        await aiApi.streamChat(
          { message: trimmed, conversationId: conversationId ?? undefined, ...override },
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
              qc.invalidateQueries({ queryKey: queryKeys.aiConversations });
              qc.invalidateQueries({ queryKey: queryKeys.aiConversation(event.result.conversationId) });
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
    [conversationId, dispatch, isStreaming, qc],
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch(finishStreaming(undefined));
    // Refresh so any partial assistant text the server persisted shows up.
    qc.invalidateQueries({ queryKey: queryKeys.aiConversations });
    if (conversationId) qc.invalidateQueries({ queryKey: queryKeys.aiConversation(conversationId) });
  }, [conversationId, dispatch, qc]);

  return { send, stop };
}
