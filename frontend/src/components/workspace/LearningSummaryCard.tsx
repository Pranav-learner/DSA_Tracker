import { Link } from 'react-router-dom';
import { Layers, BookOpen, Hash, Sparkles, Compass, Gauge } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import { MasteryBar } from '@/components/learning/MasteryBar';
import { ProblemStatusBadge } from '@/components/problems';
import { masteryTextClass } from '@/lib/mastery';
import { cn } from '@/lib/utils';
import type { LearningSummary } from '@/types';

/** "Where this problem sits in the learning system" — the connective summary. */
export function LearningSummaryCard({ summary }: { summary: LearningSummary }) {
  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="size-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Learning Summary
        </h3>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Problem status</span>
        <ProblemStatusBadge status={summary.problemStatus} />
      </div>

      <div className="space-y-2.5 text-sm">
        {summary.phase && (
          <Row icon={<Layers className="size-3.5" />} label="Phase">
            {summary.phase.title}
          </Row>
        )}
        {summary.topic && (
          <Row icon={<BookOpen className="size-3.5" />} label="Topic">
            <Link to={`/topic/${summary.topic.id}`} className="text-primary hover:underline">
              {summary.topic.title}
            </Link>
          </Row>
        )}
        <Row icon={<Hash className="size-3.5" />} label="Pattern">
          {summary.pattern}
        </Row>
        {summary.representative && (
          <Row icon={<Sparkles className="size-3.5" />} label="Type">
            <Badge variant="primary">Representative</Badge>
          </Row>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <MasteryBar value={summary.topicMastery} label="Topic Mastery" />
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="size-3.5" /> Confidence
          </span>
          <span className={cn('font-semibold tabular-nums', summary.confidence != null && masteryTextClass(summary.confidence))}>
            {summary.confidence != null ? `${summary.confidence}%` : 'Not documented'}
          </span>
        </div>
      </div>

      <Link
        to={summary.recommendation.actionTo}
        className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2 text-sm transition-colors hover:border-primary/50"
      >
        <Compass className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Recommended · </span>
          {summary.recommendation.title}
        </span>
      </Link>
    </CardContainer>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="min-w-0 truncate text-right font-medium">{children}</span>
    </div>
  );
}
