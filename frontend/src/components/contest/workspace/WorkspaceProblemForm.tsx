import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { useAddContestProblem } from '@/hooks/useContestWorkspace';
import { ApiError } from '@/api/client';
import { cn } from '@/lib/utils';
import type { CreateContestProblemInput } from '@/types';

const inputClass =
  'h-9 w-full rounded-lg border border-border bg-card/60 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30';

const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

/** Inline "add contest problem" form. */
export function WorkspaceProblemForm({ contestId, onDone }: { contestId: string; onDone?: () => void }) {
  const add = useAddContestProblem(contestId);
  const [f, setF] = useState({ problemCode: '', problemName: '', index: '', difficulty: '', attempts: '0', totalTimeSpent: '0', penalty: '0', solved: false, skipped: false });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!f.problemCode.trim() || !f.problemName.trim()) {
      setError('Problem code and name are required.');
      return;
    }
    const input: CreateContestProblemInput = {
      problemCode: f.problemCode.trim(),
      problemName: f.problemName.trim(),
      index: f.index || undefined,
      difficulty: f.difficulty || undefined,
      attempts: num(f.attempts) ?? 0,
      totalTimeSpent: num(f.totalTimeSpent) ?? 0,
      penalty: num(f.penalty) ?? 0,
      solved: f.solved,
      skipped: f.skipped,
      attempted: (num(f.attempts) ?? 0) > 0 || f.solved,
    };
    add.mutate(input, {
      onSuccess: () => onDone?.(),
      onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to add problem.'),
    });
  };

  return (
    <CardContainer>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input className={cn(inputClass, 'sm:col-span-1')} placeholder="Index (A)" value={f.index} onChange={(e) => set('index', e.target.value)} />
          <input className={cn(inputClass, 'sm:col-span-1')} placeholder="Code" value={f.problemCode} onChange={(e) => set('problemCode', e.target.value)} />
          <input className={cn(inputClass, 'sm:col-span-2')} placeholder="Problem name" value={f.problemName} onChange={(e) => set('problemName', e.target.value)} />
          <input className={inputClass} placeholder="Difficulty" value={f.difficulty} onChange={(e) => set('difficulty', e.target.value)} />
          <input type="number" min={0} className={inputClass} placeholder="Attempts" value={f.attempts} onChange={(e) => set('attempts', e.target.value)} />
          <input type="number" min={0} className={inputClass} placeholder="Solve time (min)" value={f.totalTimeSpent} onChange={(e) => set('totalTimeSpent', e.target.value)} />
          <input type="number" min={0} className={inputClass} placeholder="Penalty" value={f.penalty} onChange={(e) => set('penalty', e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={f.solved} onChange={(e) => set('solved', e.target.checked)} /> Solved</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={f.skipped} onChange={(e) => set('skipped', e.target.checked)} /> Skipped</label>
          {error && <span className="text-sm text-danger">{error}</span>}
          <div className="ml-auto flex items-center gap-2">
            {onDone && <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>}
            <Button type="submit" size="sm" disabled={add.isPending}>
              {add.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add problem
            </Button>
          </div>
        </div>
      </form>
    </CardContainer>
  );
}
