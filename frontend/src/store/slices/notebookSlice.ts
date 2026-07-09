import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NotebookSortField, Platform } from '@/types';

/**
 * Notebook UI state (search, filters, sort, pagination). Server data lives in
 * React Query; the `useNotebookList` query is built from this slice.
 */
export interface NotebookFilters {
  pattern: string | null;
  topic: string | null;
  phase: string | null;
  platform: Platform | null;
  confidenceMin: number | null;
}

export interface NotebookUiState {
  search: string;
  filters: NotebookFilters;
  sort: NotebookSortField;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

const emptyFilters: NotebookFilters = {
  pattern: null,
  topic: null,
  phase: null,
  platform: null,
  confidenceMin: null,
};

const initialState: NotebookUiState = {
  search: '',
  filters: emptyFilters,
  sort: 'recent',
  order: 'desc',
  page: 1,
  pageSize: 12,
};

const notebookSlice = createSlice({
  name: 'notebook',
  initialState,
  reducers: {
    setNotebookSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setNotebookFilter<K extends keyof NotebookFilters>(
      state: NotebookUiState,
      action: PayloadAction<{ key: K; value: NotebookFilters[K] }>,
    ) {
      state.filters[action.payload.key] = action.payload.value;
      state.page = 1;
    },
    resetNotebookFilters(state) {
      state.filters = { ...emptyFilters };
      state.search = '';
      state.page = 1;
    },
    setNotebookSort(state, action: PayloadAction<{ sort: NotebookSortField; order: 'asc' | 'desc' }>) {
      state.sort = action.payload.sort;
      state.order = action.payload.order;
      state.page = 1;
    },
    setNotebookPage(state, action: PayloadAction<number>) {
      state.page = Math.max(1, action.payload);
    },
  },
});

export const {
  setNotebookSearch,
  setNotebookFilter,
  resetNotebookFilters,
  setNotebookSort,
  setNotebookPage,
} = notebookSlice.actions;
export default notebookSlice.reducer;
