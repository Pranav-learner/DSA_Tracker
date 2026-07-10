import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AiIntent, ContextProfileName } from '@/types';

/** The context sections attached to the in-flight / latest turn (for the badge). */
export interface ActiveContext {
  intent: AiIntent;
  sections: { key: string; title: string }[];
}

/** Which subset of conversations the sidebar shows. */
export type ConversationFilter = 'all' | 'pinned' | 'archived';

/** A slash-command selection that preselects the context profile for the next turn. */
export interface ActiveCommand {
  command: string;
  intent: AiIntent;
  profiles: ContextProfileName[];
  label: string;
}

/**
 * AI mentor UI state — **UI only** (current conversation, live streaming buffer,
 * input text, drawer/sidebar visibility, context-intelligence selections and
 * conversation filters). All persisted data (conversations, messages, settings,
 * workspace snapshot, suggestions) is server-owned by React Query.
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

  /* --- Sprint 2: conversation browsing --- */
  conversationSearch: string;
  conversationFilter: ConversationFilter;

  /* --- Sprint 2: context intelligence --- */
  /** Active slash command; when set it preselects the intent + profiles. */
  activeCommand: ActiveCommand | null;
  /** Intent used to build the Context Preview (from the active command, else 'general'). */
  previewIntent: AiIntent;
  /** Section keys the learner toggled OFF in the Context Preview. */
  excludedSections: string[];
  /** Right-hand context/snapshot rail visibility (collapsible on smaller screens). */
  rightRailOpen: boolean;
  /** Mobile: which rail panel is expanded. */
  contextPreviewOpen: boolean;
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

  conversationSearch: '',
  conversationFilter: 'all',

  activeCommand: null,
  previewIntent: 'general',
  excludedSections: [],
  rightRailOpen: true,
  contextPreviewOpen: false,
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
      // Reset the composed context for a fresh thread.
      state.activeCommand = null;
      state.previewIntent = 'general';
      state.excludedSections = [];
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

    /* --- Sprint 2 --- */
    setConversationSearch(state, action: PayloadAction<string>) {
      state.conversationSearch = action.payload;
    },
    setConversationFilter(state, action: PayloadAction<ConversationFilter>) {
      state.conversationFilter = action.payload;
    },
    /** Select (or clear with null) a slash command — preselects intent + profiles. */
    setActiveCommand(state, action: PayloadAction<ActiveCommand | null>) {
      state.activeCommand = action.payload;
      state.previewIntent = action.payload?.intent ?? 'general';
      // A new context profile invalidates the old section toggles.
      state.excludedSections = [];
    },
    setPreviewIntent(state, action: PayloadAction<AiIntent>) {
      state.previewIntent = action.payload;
    },
    toggleSection(state, action: PayloadAction<string>) {
      const key = action.payload;
      state.excludedSections = state.excludedSections.includes(key)
        ? state.excludedSections.filter((k) => k !== key)
        : [...state.excludedSections, key];
    },
    setExcludedSections(state, action: PayloadAction<string[]>) {
      state.excludedSections = action.payload;
    },
    resetContext(state) {
      state.activeCommand = null;
      state.previewIntent = 'general';
      state.excludedSections = [];
    },
    toggleRightRail(state) {
      state.rightRailOpen = !state.rightRailOpen;
    },
    setRightRailOpen(state, action: PayloadAction<boolean>) {
      state.rightRailOpen = action.payload;
    },
    setContextPreviewOpen(state, action: PayloadAction<boolean>) {
      state.contextPreviewOpen = action.payload;
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
  setConversationSearch,
  setConversationFilter,
  setActiveCommand,
  setPreviewIntent,
  toggleSection,
  setExcludedSections,
  resetContext,
  toggleRightRail,
  setRightRailOpen,
  setContextPreviewOpen,
} = aiSlice.actions;
export default aiSlice.reducer;
