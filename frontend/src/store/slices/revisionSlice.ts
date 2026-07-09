import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RevisionEntityType, RevisionSessionStatus, SessionHistorySort } from '@/types';

export type WorkspaceMode = 'full' | 'quick';

/**
 * Revision UI state — calendar month/selection + schedule filter (Sprint 1) and
 * the workspace timer / mode / collapsed panels + history filters (Sprint 2).
 * Server data lives in React Query.
 */
export interface RevisionUiState {
  /** Month shown in the calendar, as 'YYYY-MM'. */
  calendarMonth: string;
  /** Selected calendar day ('YYYY-MM-DD'), or null. */
  selectedDate: string | null;
  entityFilter: RevisionEntityType | null;

  // --- Sprint 2: workspace ---
  workspaceMode: WorkspaceMode;
  timerRunning: boolean;
  elapsedSeconds: number;
  collapsedPanels: string[];

  // --- Sprint 2: history filters ---
  historyStatus: RevisionSessionStatus | null;
  historyEntityType: RevisionEntityType | null;
  historySort: SessionHistorySort;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const initialState: RevisionUiState = {
  calendarMonth: currentMonthKey(),
  selectedDate: null,
  entityFilter: null,
  workspaceMode: 'full',
  timerRunning: false,
  elapsedSeconds: 0,
  collapsedPanels: [],
  historyStatus: null,
  historyEntityType: null,
  historySort: 'recent',
};

const revisionSlice = createSlice({
  name: 'revision',
  initialState,
  reducers: {
    setCalendarMonth(state, action: PayloadAction<string>) {
      state.calendarMonth = action.payload;
      state.selectedDate = null;
    },
    stepMonth(state, action: PayloadAction<number>) {
      state.calendarMonth = shiftMonth(state.calendarMonth, action.payload);
      state.selectedDate = null;
    },
    selectDate(state, action: PayloadAction<string | null>) {
      state.selectedDate = state.selectedDate === action.payload ? null : action.payload;
    },
    setEntityFilter(state, action: PayloadAction<RevisionEntityType | null>) {
      state.entityFilter = action.payload;
    },

    // --- workspace ---
    setWorkspaceMode(state, action: PayloadAction<WorkspaceMode>) {
      state.workspaceMode = action.payload;
    },
    startTimer(state) {
      state.timerRunning = true;
    },
    pauseTimer(state) {
      state.timerRunning = false;
    },
    tickTimer(state) {
      if (state.timerRunning) state.elapsedSeconds += 1;
    },
    resetTimer(state) {
      state.timerRunning = false;
      state.elapsedSeconds = 0;
    },
    setElapsed(state, action: PayloadAction<number>) {
      state.elapsedSeconds = Math.max(0, action.payload);
    },
    togglePanel(state, action: PayloadAction<string>) {
      const key = action.payload;
      state.collapsedPanels = state.collapsedPanels.includes(key)
        ? state.collapsedPanels.filter((k) => k !== key)
        : [...state.collapsedPanels, key];
    },

    // --- history filters ---
    setHistoryFilter(
      state,
      action: PayloadAction<{
        status?: RevisionSessionStatus | null;
        entityType?: RevisionEntityType | null;
        sort?: SessionHistorySort;
      }>,
    ) {
      if (action.payload.status !== undefined) state.historyStatus = action.payload.status;
      if (action.payload.entityType !== undefined) state.historyEntityType = action.payload.entityType;
      if (action.payload.sort !== undefined) state.historySort = action.payload.sort;
    },
  },
});

export const {
  setCalendarMonth,
  stepMonth,
  selectDate,
  setEntityFilter,
  setWorkspaceMode,
  startTimer,
  pauseTimer,
  tickTimer,
  resetTimer,
  setElapsed,
  togglePanel,
  setHistoryFilter,
} = revisionSlice.actions;
export default revisionSlice.reducer;
