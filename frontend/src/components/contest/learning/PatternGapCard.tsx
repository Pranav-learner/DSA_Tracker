import { Puzzle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import type { ContestPatternAnalysis } from '@/types';

/** Pattern analysis — solved vs missed patterns + what to practice (from Pattern Intelligence). */
export function PatternGapCard({ analysis }: { analysis: ContestPatternAnalysis }) {
  return (
    <CardContainer className="space-y-4">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><Puzzle className="size-4 text-primary" /> Pattern Analysis</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><CheckCircle2 className="size-3.5 text-success" /> Solved</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.patternsSolved.length ? analysis.patternsSolved.map((p) => <Badge key={p} variant="success">{p}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><XCircle className="size-3.5 text-danger" /> Missed</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.patternsMissed.length ? analysis.patternsMissed.map((p) => <Badge key={p} variant="danger">{p}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>
      </div>

      {analysis.patternsToPractice.length > 0 && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">To practice (from Pattern Intelligence)</p>
          <ul className="space-y-1.5">
            {analysis.patternsToPractice.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{p.pattern}</span> <span className="text-muted-foreground">— {p.reason}</span>
                </span>
                {p.topicId && (
                  <Link to={`/topic/${p.topicId}`} className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline">
                    Open <ArrowRight className="size-3" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardContainer>
  );
}
