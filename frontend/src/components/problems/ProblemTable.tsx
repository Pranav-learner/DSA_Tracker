import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, Star as StarIcon } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformBadge } from './PlatformBadge';
import { ProblemStatusBadge } from './ProblemStatusBadge';
import { FavoriteButton } from './FavoriteButton';
import { cn } from '@/lib/utils';
import type { ProblemListItem } from '@/types';

interface ProblemTableProps {
  problems: ProblemListItem[];
  isLoading?: boolean;
}

/** Dense, sortable-looking read-only table of problems. Rows open the detail. */
export const ProblemTable = memo(function ProblemTable({ problems, isLoading }: ProblemTableProps) {
  const navigate = useNavigate();

  return (
    <CardContainer className={cn('overflow-hidden p-0', isLoading && 'opacity-60')}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 font-medium">Problem</th>
              <th className="px-4 py-3 font-medium">Platform</th>
              <th className="px-4 py-3 font-medium">Difficulty</th>
              <th className="px-4 py-3 font-medium">Pattern</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Est.</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/problems/${p.id}`)}
                className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
              >
                <td className="px-4 py-3">
                  <FavoriteButton favorite={p.favorite} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="line-clamp-1">{p.title}</span>
                    {p.representative && (
                      <StarIcon
                        className="size-3 shrink-0 fill-primary/70 text-primary/70"
                        aria-label="Representative problem"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PlatformBadge platform={p.platform} />
                </td>
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={p.difficulty} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="line-clamp-1">{p.pattern}</span>
                </td>
                <td className="px-4 py-3">
                  <ProblemStatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="size-3.5" />
                    {p.estimatedSolveTime}m
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLoading && problems.length === 0 && (
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}
    </CardContainer>
  );
});
