import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddTimelineEvent } from '@/hooks/useContestWorkspace';
import { EVENT_META } from '@/lib/contestWorkspace';
import { cn } from '@/lib/utils';
import type { ContestEventType, CreateTimelineEventInput } from '@/types';

const inputClass =
  'h-9 rounded-lg border border-border bg-card/60 px-3 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30';

const EVENT_TYPES = Object.keys(EVENT_META) as ContestEventType[];

/** Compact "add timeline event" form. */
export function WorkspaceEventForm({ contestId, onDone }: { contestId: string; onDone?: () => void }) {
  const add = useAddTimelineEvent(contestId);
  const [eventType, setEventType] = useState<ContestEventType>('problem-opened');
  const [problemCode, setProblemCode] = useState('');
  const [description, setDescription] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateTimelineEventInput = { eventType, problemCode: problemCode || undefined, description: description || undefined };
    add.mutate(input, { onSuccess: () => { setProblemCode(''); setDescription(''); onDone?.(); } });
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <select className={inputClass} value={eventType} onChange={(e) => setEventType(e.target.value as ContestEventType)}>
        {EVENT_TYPES.map((t) => (
          <option key={t} value={t}>{EVENT_META[t].label}</option>
        ))}
      </select>
      <input className={cn(inputClass, 'w-24')} placeholder="Code" value={problemCode} onChange={(e) => setProblemCode(e.target.value)} />
      <input className={cn(inputClass, 'flex-1')} placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button type="submit" size="sm" variant="secondary" disabled={add.isPending}>
        {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Log event
      </Button>
    </form>
  );
}
