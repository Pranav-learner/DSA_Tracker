import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Difficulty,
  Platform,
  ProblemSortField,
  ProblemStatus,
} from '@/types';

/**
 * Problem Library UI state (filters, search, sort, view, pagination). This is
 * pure UI state — the server data itself lives in React Query. The `useProblems`
 * query is built from this slice, so any change here re-runs the query.
 */
export interface ProblemFilters {
  platform: Platform | null;
  difficulty: Difficulty | null;
  phase: string | null;
  topic: string | null;
  pattern: string | null;
  status: ProblemStatus | null;
  representative: boolean | null;
  favorite: boolean;
}

export interface ProblemsUiState {
  search: string;
  filters: ProblemFilters;
  sort: ProblemSortField;
  order: 'asc' | 'desc';
  view: 'table' | 'grid';
  page: number;
  pageSize: number;
}

const emptyFilters: ProblemFilters = {
  platform: null,
  difficulty: null,
  phase: null,
  topic: null,
  pattern: null,
  status: null,
  representative: null,
  favorite: false,
};

const initialState: ProblemsUiState = {
  search: '',
  filters: emptyFilters,
  sort: 'difficulty',
  order: 'asc',
  view: 'table',
  page: 1,
  pageSize: 20,
};

const problemsSlice = createSlice({
  name: 'problems',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1; // any query change resets to the first page
    },
    setFilter<K extends keyof ProblemFilters>(
      state: ProblemsUiState,
      action: PayloadAction<{ key: K; value: ProblemFilters[K] }>,
    ) {
      state.filters[action.payload.key] = action.payload.value;
      state.page = 1;
    },
    resetFilters(state) {
      state.filters = { ...emptyFilters };
      state.search = '';
      state.page = 1;
    },
    setSort(state, action: PayloadAction<{ sort: ProblemSortField; order: 'asc' | 'desc' }>) {
      state.sort = action.payload.sort;
      state.order = action.payload.order;
      state.page = 1;
    },
    setView(state, action: PayloadAction<'table' | 'grid'>) {
      state.view = action.payload;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload);
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.page = 1;
    },
  },
});

export const { setSearch, setFilter, resetFilters, setSort, setView, setPage, setPageSize } =
  problemsSlice.actions;
export default problemsSlice.reducer;
