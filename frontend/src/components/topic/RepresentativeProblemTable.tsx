import { useNavigate } from 'react-router-dom';
import { ExternalLink, Clock, ChevronRight } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import type { RepresentativeProblem } from '@/types';

interface Props {
  topicId: string;
  problems?: RepresentativeProblem[];
  isLoading?: boolean;
}

/**
 * Read-only table of representative problems. This is NOT the problem tracker —
 * clicking a row opens a placeholder detail page.
 */
export function RepresentativeProblemTable({ topicId, problems, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <CardContainer className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContainer>
    );
  }

  if (!problems || problems.length === 0) {
    return (
      <EmptyState
        title="No representative problems yet"
        description="Curated problems will appear here once seeded."
      />
    );
  }

  return (
    <CardContainer className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
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
                onClick={() =>
                  navigate(`/topic/${topicId}/problem/${p.id}`, { state: { problem: p } })
                }
                className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    {p.name}
                    {p.url && <ExternalLink className="size-3.5 text-muted-foreground" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.platform}</td>
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={p.difficulty} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.pattern}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="size-3.5" />
                    {p.estimatedMinutes}m
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
    </CardContainer>
  );
}
