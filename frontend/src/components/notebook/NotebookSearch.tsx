import { useCallback } from 'react';
import { SearchBar } from '@/components/problems';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNotebookSearch } from '@/store/slices/notebookSlice';

/** Notebook full-text search — reuses the shared debounced SearchBar. */
export function NotebookSearch({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const search = useAppSelector((s) => s.notebook.search);
  const onChange = useCallback((v: string) => dispatch(setNotebookSearch(v)), [dispatch]);

  return (
    <SearchBar
      value={search}
      onChange={onChange}
      placeholder="Search your notebook — pattern, observation, lesson…"
      className={className}
    />
  );
}
