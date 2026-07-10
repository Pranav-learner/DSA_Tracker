import { HeartPulse, CalendarClock, Swords, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MentorBrief } from '@/types';

interface LearningHealthSummaryProps {
  brief: Pick<MentorBrief, 'learningHealth' | 'revisionDue' | 'contestReadiness' | 'estimatedStudyMinutes'>;
  className?: string;
}

const HEALTH_TONE: Record<string, string> = {
  excellent: 'text-success',
  good: 'text-success',
  fair: 'text-warning',
  'at-risk': 'text-danger',
};

/**
 * LearningHealthSummary — a compact metric strip (health, revision due, contest
 * readiness, study time) derived from the mentor brief. Reused in the brief card
 * and on the dashboard.
 */
export function LearningHealthSummary({ brief, className }: LearningHealthSummaryProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      <Metric
        icon={<HeartPulse className="size-3.5" />}
        label="Health"
        value={brief.learningHealth ? `${brief.learningHealth.score}` : '—'}
        tone={brief.learningHealth ? HEALTH_TONE[brief.learningHealth.status] : undefined}
        hint={brief.learningHealth?.status}
      />
      <Metric icon={<CalendarClock className="size-3.5" />} label="Revision due" value={String(brief.revisionDue)} tone={brief.revisionDue > 0 ? 'text-warning' : undefined} />
      <Metric icon={<Swords className="size-3.5" />} label="Contest" value={brief.contestReadiness !== null ? `${brief.contestReadiness}` : '—'} />
      <Metric icon={<Clock className="size-3.5" />} label="Study time" value={`${brief.estimatedStudyMinutes}m`} />
    </div>
  );
}

function Metric({ icon, label, value, tone, hint }: { icon: React.ReactNode; label: string; value: string; tone?: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}<span className="truncate">{label}</span></div>
      <p className={cn('mt-0.5 truncate text-sm font-semibold tabular-nums', tone)} title={hint}>{value}</p>
    </div>
  );
}
