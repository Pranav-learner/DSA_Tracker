import { useNavigate } from 'react-router-dom';
import { Check, X, CircleCheck, ArrowRight, Flag } from 'lucide-react';
import { useUpdateRecommendation } from '@/hooks/useAI';
import { actionIcon } from '@/lib/coachIcons';
import { relativeTime, cn } from '@/lib/utils';
import type { Recommendation, RecommendationStatus } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

const PRIORITY_TONE: Record<string, string> = {
  high: 'bg-danger/15 text-danger',
  medium: 'bg-warning/15 text-warning',
  low: 'bg-accent text-muted-foreground',
};

const STATUS_TONE: Record<string, string> = {
  generated: 'text-muted-foreground',
  viewed: 'text-muted-foreground',
  accepted: 'text-primary',
  completed: 'text-success',
  dismissed: 'text-muted-foreground',
  archived: 'text-muted-foreground',
};

/**
 * RecommendationCard — one tracked AI recommendation with its lifecycle controls.
 * The learner drives the lifecycle (accept → complete, or dismiss); the AI never
 * advances it automatically. The action deep-links into the relevant module.
 */
export function RecommendationCard({ recommendation, className }: RecommendationCardProps) {
  const navigate = useNavigate();
  const update = useUpdateRecommendation();
  const r = recommendation;
  const Icon = r.action ? actionIcon(r.action.kind) : Flag;

  const set = (status: RecommendationStatus) => update.mutate({ id: r.id, status });
  const done = r.status === 'completed' || r.status === 'dismissed' || r.status === 'archived';

  return (
    <div className={cn('rounded-lg border border-border bg-card/60 p-3', done && 'opacity-70', className)}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider', PRIORITY_TONE[r.priority])}>{r.priority}</span>
            <p className="truncate text-sm font-medium">{r.title}</p>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{r.reason}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px]">
            <span className={cn('font-medium capitalize', STATUS_TONE[r.status])}>{r.status}</span>
            <span className="text-muted-foreground">· {relativeTime(r.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {r.action?.to && (
          <button
            type="button"
            onClick={() => {
              if (r.status === 'generated' || r.status === 'viewed') set('accepted');
              navigate(r.action!.to);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/12 px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {r.action.label} <ArrowRight className="size-3" />
          </button>
        )}
        {!done && (
          <>
            {r.status !== 'accepted' && (
              <LifecycleBtn icon={<Check className="size-3" />} label="Accept" onClick={() => set('accepted')} />
            )}
            {r.status === 'accepted' && (
              <LifecycleBtn icon={<CircleCheck className="size-3" />} label="Complete" tone="success" onClick={() => set('completed')} />
            )}
            <LifecycleBtn icon={<X className="size-3" />} label="Dismiss" onClick={() => set('dismissed')} />
          </>
        )}
      </div>
    </div>
  );
}

function LifecycleBtn({ icon, label, onClick, tone }: { icon: React.ReactNode; label: string; onClick: () => void; tone?: 'success' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground',
        tone === 'success' ? 'hover:border-success/40 hover:text-success' : 'hover:border-primary/40',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
