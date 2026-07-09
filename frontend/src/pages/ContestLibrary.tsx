import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Library, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContests, useContestFacets } from '@/hooks/useContests';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setContestSearch } from '@/store/slices/contestSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import {
  ContestTable,
  ContestFilterBar,
  ContestSearch,
  ContestEmptyState,
  ContestSkeleton,
} from '@/components/contest';
import type { ContestQuery } from '@/types';

/** Contest Library — the full searchable, filterable, paginated contest table. */
export function ContestLibrary() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.contest);
  const { data: facets } = useContestFacets();
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const query: ContestQuery = useMemo(
    () => ({
      page,
      pageSize: 20,
      q: debouncedSearch || undefined,
      platform: filters.platform ?? undefined,
      contestType: filters.contestType ?? undefined,
      rated: filters.ratedOnly ?? undefined,
      sort: filters.sort,
      order: filters.order,
    }),
    [page, debouncedSearch, filters.platform, filters.contestType, filters.ratedOnly, filters.sort, filters.order],
  );

  // Reset to page 1 whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.platform, filters.contestType, filters.ratedOnly, filters.sort, filters.order]);

  const { data, isLoading, isError, error, refetch } = useContests(query);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Competitive Programming"
        title="Contest Library"
        description="Every contest you've logged, searchable and filterable."
        icon={<Library className="size-5" />}
        action={
          <Button size="sm" asChild>
            <Link to="/contests/new"><Plus className="size-4" /> Add contest</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <ContestSearch value={filters.search} onChange={(v) => dispatch(setContestSearch(v))} />
        <ContestFilterBar facets={facets} />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading && !data ? (
        <ContestSkeleton rows={8} />
      ) : data && data.items.length === 0 ? (
        <ContestEmptyState title="No contests match" description="Try clearing filters or adding a contest." />
      ) : (
        <>
          <ContestTable contests={data?.items ?? []} />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data ? `${data.total} contest${data.total === 1 ? '' : 's'}` : ''} · page {data?.page ?? 1}/{data?.totalPages ?? 1}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={!data?.hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="size-4" /> Prev
              </Button>
              <Button variant="secondary" size="sm" disabled={!data?.hasNext} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
