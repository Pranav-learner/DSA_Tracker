import { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { useSessionHistory } from '@/hooks/useRevisionSession';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setHistoryFilter } from '@/store/slices/revisionSlice';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { RevisionHistoryTable } from '@/components/revision';
import { Pagination } from '@/components/problems';
import type { RevisionEntityType, RevisionSessionStatus, SessionHistoryQuery, SessionHistorySort } from '@/types';

const selectClass =
  'h-9 rounded-md border border-border bg-card/60 px-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/40';

export function RevisionHistoryPage() {
  const dispatch = useAppDispatch();
  const { historyStatus, historyEntityType, historySort } = useAppSelector((s) => s.revision);
  const [page, setPage] = useState(1);

  const query = useMemo<SessionHistoryQuery>(
    () => ({
      page,
      pageSize: 20,
      sort: historySort,
      status: historyStatus ?? undefined,
      entityType: historyEntityType ?? undefined,
    }),
    [page, historySort, historyStatus, historyEntityType],
  );

  const { data, isLoading, isError, error, refetch } = useSessionHistory(query);
  const reset = () => setPage(1);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Revision Engine"
        title="Revision History"
        description="Every review session you've completed — permanently recorded."
        icon={<History className="size-5" />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Field label="Status">
          <select
            className={selectClass}
            value={historyStatus ?? ''}
            onChange={(e) => {
              dispatch(setHistoryFilter({ status: (e.target.value || null) as RevisionSessionStatus | null }));
              reset();
            }}
          >
            <option value="">All</option>
            <option value="Completed">Completed</option>
            <option value="Abandoned">Abandoned</option>
            <option value="Started">In Progress</option>
          </select>
        </Field>
        <Field label="Type">
          <select
            className={selectClass}
            value={historyEntityType ?? ''}
            onChange={(e) => {
              dispatch(setHistoryFilter({ entityType: (e.target.value || null) as RevisionEntityType | null }));
              reset();
            }}
          >
            <option value="">All</option>
            <option value="topic">Topic</option>
            <option value="pattern">Pattern</option>
            <option value="knowledgeEntry">Notebook</option>
          </select>
        </Field>
        <Field label="Sort">
          <select
            className={selectClass}
            value={historySort}
            onChange={(e) => {
              dispatch(setHistoryFilter({ sort: e.target.value as SessionHistorySort }));
              reset();
            }}
          >
            <option value="recent">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="duration">Duration</option>
          </select>
        </Field>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : (
        <>
          <RevisionHistoryTable sessions={data.items} />
          {data.items.length > 0 && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
