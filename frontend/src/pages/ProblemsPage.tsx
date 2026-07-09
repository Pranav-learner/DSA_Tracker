import { useCallback, useMemo } from 'react';
import { LibraryBig, LayoutGrid, Table2, ArrowDownUp } from 'lucide-react';
import { useProblems } from '@/hooks/useProblems';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSearch, setSort, setView, setPage } from '@/store/slices/problemsSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import {
  SearchBar,
  FilterPanel,
  ProblemTable,
  ProblemCard,
  Pagination,
} from '@/components/problems';
import { cn } from '@/lib/utils';
import type { ProblemSortField, ProblemsQuery } from '@/types';

/** Sort presets exposed in the toolbar (label → sort field + order). */
const SORT_OPTIONS: { key: string; label: string; sort: ProblemSortField; order: 'asc' | 'desc' }[] = [
  { key: 'difficulty:asc', label: 'Difficulty ↑', sort: 'difficulty', order: 'asc' },
  { key: 'difficulty:desc', label: 'Difficulty ↓', sort: 'difficulty', order: 'desc' },
  { key: 'title:asc', label: 'Title A–Z', sort: 'title', order: 'asc' },
  { key: 'title:desc', label: 'Title Z–A', sort: 'title', order: 'desc' },
  { key: 'estimatedSolveTime:asc', label: 'Quickest', sort: 'estimatedSolveTime', order: 'asc' },
  { key: 'estimatedSolveTime:desc', label: 'Longest', sort: 'estimatedSolveTime', order: 'desc' },
  { key: 'platform:asc', label: 'Platform', sort: 'platform', order: 'asc' },
  { key: 'recent:desc', label: 'Recently added', sort: 'recent', order: 'desc' },
];

export function ProblemsPage() {
  const dispatch = useAppDispatch();
  const { search, filters, sort, order, view, page, pageSize } = useAppSelector((s) => s.problems);

  const query = useMemo<ProblemsQuery>(
    () => ({
      page,
      pageSize,
      sort,
      order,
      q: search || undefined,
      platform: filters.platform ?? undefined,
      difficulty: filters.difficulty ?? undefined,
      phase: filters.phase ?? undefined,
      topic: filters.topic ?? undefined,
      pattern: filters.pattern ?? undefined,
      status: filters.status ?? undefined,
      representative: filters.representative ?? undefined,
      favorite: filters.favorite || undefined,
    }),
    [page, pageSize, sort, order, search, filters],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useProblems(query);
  const handleSearch = useCallback((v: string) => dispatch(setSearch(v)), [dispatch]);

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Knowledge Engine"
        title="Problem Library"
        description="The central catalog of DSA & competitive-programming problems — search, filter and open any problem."
        icon={<LibraryBig className="size-5" />}
      />

      {/* Toolbar: search + sort + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search by title, pattern or tag…"
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center">
            <ArrowDownUp className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
            <select
              value={`${sort}:${order}`}
              onChange={(e) => {
                const opt = SORT_OPTIONS.find((o) => o.key === e.target.value)!;
                dispatch(setSort({ sort: opt.sort, order: opt.order }));
              }}
              aria-label="Sort problems"
              className="h-10 rounded-md border border-border bg-card/60 pl-8 pr-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/40"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex rounded-md border border-border p-0.5">
            <ViewButton active={view === 'table'} onClick={() => dispatch(setView('table'))} label="Table view">
              <Table2 className="size-4" />
            </ViewButton>
            <ViewButton active={view === 'grid'} onClick={() => dispatch(setView('grid'))} label="Grid view">
              <LayoutGrid className="size-4" />
            </ViewButton>
          </div>
        </div>
      </div>

      <FilterPanel />

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <LoadingSkeleton count={view === 'grid' ? 9 : 8} layout={view === 'grid' ? 'grid' : 'list'} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No problems match your filters"
          description="Try clearing a filter or adjusting your search to widen the results."
        />
      ) : view === 'grid' ? (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', isFetching && 'opacity-70')}>
          {items.map((p, i) => (
            <ProblemCard key={p.id} problem={p} index={i} />
          ))}
        </div>
      ) : (
        <ProblemTable problems={items} isLoading={isFetching} />
      )}

      {data && items.length > 0 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          onPageChange={(p) => dispatch(setPage(p))}
        />
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex size-9 items-center justify-center rounded transition-colors',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
