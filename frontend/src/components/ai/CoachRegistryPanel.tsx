import { Users } from 'lucide-react';
import { useCoaches } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCoach } from '@/store/slices/aiSlice';
import { CoachCard } from './CoachCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CoachRegistryPanelProps {
  className?: string;
  /** Fired after a coach is chosen (e.g. to close a picker). */
  onPick?: (coachId: string) => void;
}

/**
 * CoachRegistryPanel — a browsable directory of every registered coach (from the
 * live CoachRegistry). Selecting one activates it. Great for a "choose your coach"
 * view; also demonstrates that the coach set is data-driven, not hardcoded.
 */
export function CoachRegistryPanel({ className, onPick }: CoachRegistryPanelProps) {
  const dispatch = useAppDispatch();
  const selectedCoachId = useAppSelector((s) => s.ai.selectedCoachId);
  const mode = useAppSelector((s) => s.ai.conversationMode);
  const { data, isLoading } = useCoaches();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Specialized coaches</h3>
        {data && <span className="ml-auto text-[11px] text-muted-foreground">{data.coaches.length} available</span>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data?.coaches.map((c) => (
            <CoachCard
              key={c.id}
              coach={c}
              active={mode === 'coach' && selectedCoachId === c.id}
              onSelect={() => {
                dispatch(selectCoach(c.id));
                onPick?.(c.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
