import { useMemo, useState } from 'react';
import { ExternalLink, ArrowUpDown } from 'lucide-react';
import { ContestStatusBadge } from './ContestStatusBadge';
import { formatMinutes } from '@/lib/contestWorkspace';
import { cn } from '@/lib/utils';
import type { ContestProblem } from '@/types';

type SortKey = 'index' | 'attempts' | 'totalTimeSpent' | 'penalty';

/** The contest problem table — sortable + status-filterable. */
export function ContestProblemTable({
  problems,
  statusFilter = 'all',
  onSelect,
}: {
  problems: ContestProblem[];
  statusFilter?: 'all' | 'solved' | 'attempted' | 'skipped';
  onSelect?: (id: string) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'index', dir: 1 });

  const rows = useMemo(() => {
    const filtered = problems.filter((p) => statusFilter === 'all' || p.status === statusFilter);
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * sort.dir;
      return ((av as number) - (bv as number)) * sort.dir;
    });
  }, [problems, statusFilter, sort]);

  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));

  const Th = ({ label, k }: { label: string; k?: SortKey }) => (
    <th className="px-4 py-2.5 text-left font-medium">
      {k ? (
        <button type="button" onClick={() => toggle(k)} className="inline-flex items-center gap-1 hover:text-foreground">
          {label} <ArrowUpDown className="size-3 opacity-60" />
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border bg-card/40 text-xs uppercase tracking-wider text-muted-foreground">
            <Th label="#" k="index" />
            <Th label="Problem" />
            <Th label="Difficulty" />
            <Th label="Attempts" k="attempts" />
            <Th label="Solve Time" k="totalTimeSpent" />
            <Th label="Penalty" k="penalty" />
            <Th label="Status" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((p) => (
            <tr key={p.id} className={cn('transition-colors hover:bg-card/40', onSelect && 'cursor-pointer')} onClick={() => onSelect?.(p.id)}>
              <td className="px-4 py-3 font-semibold tabular-nums">{p.index || '—'}</td>
              <td className="max-w-[240px] px-4 py-3">
                <span className="truncate font-medium">{p.problemName}</span>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex text-muted-foreground hover:text-primary" aria-label="Open problem" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{p.difficulty || '—'}</td>
              <td className="px-4 py-3 tabular-nums">{p.attempts}</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{p.solved ? formatMinutes(p.totalTimeSpent) : '—'}</td>
              <td className={cn('px-4 py-3 tabular-nums', p.penalty > 0 ? 'text-warning' : 'text-muted-foreground')}>{p.penalty || '—'}</td>
              <td className="px-4 py-3"><ContestStatusBadge status={p.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
