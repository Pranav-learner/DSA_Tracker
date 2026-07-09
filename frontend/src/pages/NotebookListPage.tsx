import { useMemo } from 'react';
import { BrainCircuit, ArrowDownUp } from 'lucide-react';
import { useNotebookList } from '@/hooks/useNotebook';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNotebookSort, setNotebookPage } from '@/store/slices/notebookSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/problems';
import { NotebookCard, NotebookSearch, NotebookFilters } from '@/components/notebook';
import { cn } from '@/lib/utils';
import type { NotebookQuery, NotebookSortField } from '@/types';

const SORT_OPTIONS: { key: string; label: string; sort: NotebookSortField; order: 'asc' | 'desc' }[] = [
  { key: 'recent:desc', label: 'Recently Updated', sort: 'recent', order: 'desc' },
  { key: 'confidence:desc', label: 'Highest Confidence', sort: 'confidence', order: 'desc' },
  { key: 'reviewed:desc', label: 'Recently Reviewed', sort: 'reviewed', order: 'desc' },
  { key: 'alpha:asc', label: 'Alphabetical', sort: 'alpha', order: 'asc' },
];

export function NotebookListPage() {
  const dispatch = useAppDispatch();
  const { search, filters, sort, order, page, pageSize } = useAppSelector((s) => s.notebook);

  const query = useMemo<NotebookQuery>(
    () => ({
      page,
      pageSize,
      sort,
      order,
      q: search || undefined,
      pattern: filters.pattern ?? undefined,
      topic: filters.topic ?? undefined,
      phase: filters.phase ?? undefined,
      platform: filters.platform ?? undefined,
      confidenceMin: filters.confidenceMin ?? undefined,
    }),
    [page, pageSize, sort, order, search, filters],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useNotebookList(query);
  const items = data?.items ?? [];
  const hasFilters = Boolean(search) || Object.values(filters).some((v) => v !== null);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Knowledge Engine"
        title="Pattern Notebook"
        description="Your second brain — every documented problem, its key idea, mistakes and the patterns that connect them."
        icon={<BrainCircuit className="size-5" />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <NotebookSearch className="flex-1" />
        <label className="relative inline-flex items-center">
          <ArrowDownUp className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
          <select
            value={`${sort}:${order}`}
            onChange={(e) => {
              const opt = SORT_OPTIONS.find((o) => o.key === e.target.value)!;
              dispatch(setNotebookSort({ sort: opt.sort, order: opt.order }));
            }}
            aria-label="Sort notebook"
            className="h-10 rounded-md border border-border bg-card/60 pl-8 pr-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/40"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <NotebookFilters />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <LoadingSkeleton count={6} layout="grid" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BrainCircuit className="size-6" />}
          title={hasFilters ? 'No entries match your search' : 'Your notebook is empty'}
          description={
            hasFilters
              ? 'Try clearing a filter or adjusting your search.'
              : 'Open a problem and document it to add your first knowledge entry.'
          }
        />
      ) : (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', isFetching && 'opacity-70')}>
          {items.map((entry, i) => (
            <NotebookCard key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      )}

      {data && items.length > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          onPageChange={(p) => dispatch(setNotebookPage(p))}
        />
      )}
    </div>
  );
}
