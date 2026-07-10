import { Cpu, Target, CircleCheck, ListTodo, Percent } from 'lucide-react';
import { useMentorOverview } from '@/hooks/useAI';
import { CardContainer } from '@/components/common/CardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * MentorOverview — the AI Operating System header: what the mentor recommends
 * right now plus recommendation effectiveness (active / completed / acceptance).
 * Self-fetches the shared overview (deduped with the dashboard's other reads).
 */
export function MentorOverview({ className }: { className?: string }) {
  const { data, isLoading } = useMentorOverview();

  return (
    <CardContainer className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Cpu className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">AI Operating System</h2>
          <p className="truncate text-xs text-muted-foreground">
            {isLoading ? 'Loading your mentor…' : data?.brief.headline ?? 'Your mentor coordinates every module — you stay in control.'}
          </p>
        </div>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-16 w-full rounded-lg" />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat icon={<Target className="size-3.5" />} label="Focus today" value={data.brief.todaysFocus} wide />
          <Stat icon={<ListTodo className="size-3.5" />} label="Active" value={String(data.stats.active)} />
          <Stat icon={<CircleCheck className="size-3.5" />} label="Completed" value={String(data.stats.completed)} tone="text-success" />
          <Stat icon={<Percent className="size-3.5" />} label="Acceptance" value={`${data.stats.acceptanceRate}%`} />
        </div>
      )}
    </CardContainer>
  );
}

function Stat({ icon, label, value, tone, wide }: { icon: React.ReactNode; label: string; value: string; tone?: string; wide?: boolean }) {
  return (
    <div className={cn('rounded-lg border border-border bg-background/40 px-2.5 py-2', wide && 'col-span-2 sm:col-span-1')}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}<span className="truncate">{label}</span></div>
      <p className={cn('mt-0.5 truncate text-sm font-semibold', tone)} title={value}>{value}</p>
    </div>
  );
}
