import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AiIntent } from '@/types';

/** The context sections attached to the in-flight / latest turn (for the badge). */
export interface ActiveContext {
  intent: AiIntent;
  sections: { key: string; title: string }[];
}

/**
 * AI mentor UI state — **UI only** (current conversation, live streaming buffer,
 * input text, drawer/sidebar visibility). All persisted data (conversations,
 * messages, settings) is server-owned by React Query.
 */
export interface AiUiState {
  currentConversationId: string | null;
  input: string;
  /** True while an assistant response is streaming in. */
  isStreaming: boolean;
  /** The just-sent user message, shown optimistically until the turn persists. */
  pendingUserMessage: string | null;
  /** Accumulated tokens of the in-flight assistant message. */
  streamingContent: string;
  streamError: string | null;
  /** Context used by the latest/streaming turn (drives the ContextBadge). */
  activeContext: ActiveContext | null;
  sidebarOpen: boolean;
  settingsOpen: boolean;
}

const initialState: AiUiState = {
  currentConversationId: null,
  input: '',
  isStreaming: false,
  pendingUserMessage: null,
  streamingContent: '',
  streamError: null,
  activeContext: null,
  sidebarOpen: true,
  settingsOpen: false,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setCurrentConversation(state, action: PayloadAction<string | null>) {
      state.currentConversationId = action.payload;
      state.streamingContent = '';
      state.isStreaming = false;
      state.streamError = null;
    },
    newConversation(state) {
      state.currentConversationId = null;
      state.input = '';
      state.streamingContent = '';
      state.pendingUserMessage = null;
      state.isStreaming = false;
      state.streamError = null;
      state.activeContext = null;
    },
    setInput(state, action: PayloadAction<string>) {
      state.input = action.payload;
    },
    startStreaming(state, action: PayloadAction<string>) {
      state.isStreaming = true;
      state.pendingUserMessage = action.payload;
      state.streamingContent = '';
      state.streamError = null;
      state.input = '';
    },
    appendStreamToken(state, action: PayloadAction<string>) {
      state.streamingContent += action.payload;
    },
    setActiveContext(state, action: PayloadAction<ActiveContext | null>) {
      state.activeContext = action.payload;
    },
    finishStreaming(state, action: PayloadAction<{ conversationId?: string } | undefined>) {
      state.isStreaming = false;
      state.streamingContent = '';
      state.pendingUserMessage = null;
      if (action.payload?.conversationId) state.currentConversationId = action.payload.conversationId;
    },
    streamError(state, action: PayloadAction<string>) {
      state.isStreaming = false;
      state.streamError = action.payload;
      // Keep pendingUserMessage so the failed turn stays visible for retry.
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSettingsOpen(state, action: PayloadAction<boolean>) {
      state.settingsOpen = action.payload;
    },
  },
});

export const {
  setCurrentConversation,
  newConversation,
  setInput,
  startStreaming,
  appendStreamToken,
  setActiveContext,
  finishStreaming,
  streamError,
  setSidebarOpen,
  toggleSidebar,
  setSettingsOpen,
} = aiSlice.actions;
export default aiSlice.reducer;
