import { BarChart3 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ScoreBars } from './ScoreBars';
import type { ExecutiveScores } from '@/types';

/** Report chart — the executive scores as labelled bars (print-friendly). */
export function ReportChart({ scores, title = 'Executive Scores' }: { scores: ExecutiveScores; title?: string }) {
  const items = [
    { label: 'Overall Readiness', score: scores.overallReadiness },
    { label: 'Learning', score: scores.learning },
    { label: 'Knowledge', score: scores.knowledge },
    { label: 'Retention', score: scores.retention },
    { label: 'Revision', score: scores.revision },
    { label: 'Productivity', score: scores.productivity },
  ];
  return (
    <CardContainer className="space-y-4">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
        <BarChart3 className="size-4 text-primary" /> {title}
      </h3>
      <ScoreBars items={items} />
    </CardContainer>
  );
}
