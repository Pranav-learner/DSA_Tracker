import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RevisionEntityType } from '@/types';

/**
 * Revision UI state — the calendar month/selection and the schedule filter.
 * Server data (queue, calendar, schedules) lives in React Query.
 */
export interface RevisionUiState {
  /** Month shown in the calendar, as 'YYYY-MM'. */
  calendarMonth: string;
  /** Selected calendar day ('YYYY-MM-DD'), or null. */
  selectedDate: string | null;
  entityFilter: RevisionEntityType | null;
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
  },
});

export const { setCalendarMonth, stepMonth, selectDate, setEntityFilter } = revisionSlice.actions;
export default revisionSlice.reducer;
