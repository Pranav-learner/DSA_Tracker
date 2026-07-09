import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { useCreateContest, useContestFacets } from '@/hooks/useContests';
import { ApiError } from '@/api/client';
import { cn } from '@/lib/utils';
import type { ContestPlatform, ContestType, CreateContestInput } from '@/types';

const PLATFORMS: ContestPlatform[] = ['Codeforces', 'LeetCode', 'AtCoder', 'CodeChef'];
const TYPES: ContestType[] = ['Rated', 'Unrated', 'Virtual'];

const inputClass =
  'h-9 w-full rounded-lg border border-border bg-card/60 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30';

function num(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** A self-contained "quick add contest" form (manual data entry). */
export function QuickAddContest({ onDone }: { onDone?: () => void }) {
  const { data: facets } = useContestFacets();
  const create = useCreateContest();
  const [platform, setPlatform] = useState<ContestPlatform>('Codeforces');
  const [form, setForm] = useState({
    contestId: '',
    contestName: '',
    contestType: 'Rated' as ContestType,
    division: '',
    startTime: '',
    durationMinutes: '120',
    ratingBefore: '',
    ratingAfter: '',
    rank: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const divisions = facets?.platforms.find((p) => p.platform === platform)?.divisions ?? [];
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.contestId.trim() || !form.contestName.trim() || !form.startTime) {
      setError('Contest id, name and start time are required.');
      return;
    }
    const input: CreateContestInput = {
      platform,
      contestId: form.contestId.trim(),
      contestName: form.contestName.trim(),
      contestType: form.contestType,
      division: form.division || undefined,
      startTime: new Date(form.startTime).toISOString(),
      durationMinutes: num(form.durationMinutes) ?? 0,
      ratingBefore: num(form.ratingBefore),
      ratingAfter: num(form.ratingAfter),
      rank: num(form.rank),
      notes: form.notes || undefined,
    };
    create.mutate(input, {
      onSuccess: () => onDone?.(),
      onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to add contest.'),
    });
  };

  return (
    <CardContainer>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Platform">
            <select className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value as ContestPlatform)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Contest type">
            <select className={inputClass} value={form.contestType} onChange={(e) => set('contestType', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Contest id">
            <input className={inputClass} value={form.contestId} onChange={(e) => set('contestId', e.target.value)} placeholder="e.g. 1962" />
          </Field>
          <Field label="Division / series">
            <select className={inputClass} value={form.division} onChange={(e) => set('division', e.target.value)}>
              <option value="">—</option>
              {divisions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Contest name" full>
            <input className={inputClass} value={form.contestName} onChange={(e) => set('contestName', e.target.value)} placeholder="Codeforces Round …" />
          </Field>
          <Field label="Start time">
            <input type="datetime-local" className={inputClass} value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </Field>
          <Field label="Duration (min)">
            <input type="number" min={0} className={inputClass} value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />
          </Field>
          <Field label="Rating before">
            <input type="number" className={inputClass} value={form.ratingBefore} onChange={(e) => set('ratingBefore', e.target.value)} placeholder="optional" />
          </Field>
          <Field label="Rating after">
            <input type="number" className={inputClass} value={form.ratingAfter} onChange={(e) => set('ratingAfter', e.target.value)} placeholder="optional" />
          </Field>
          <Field label="Rank">
            <input type="number" min={0} className={inputClass} value={form.rank} onChange={(e) => set('rank', e.target.value)} placeholder="optional" />
          </Field>
          <Field label="Notes" full>
            <input className={inputClass} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="optional" />
          </Field>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={create.isPending}>
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add contest
          </Button>
          {onDone && (
            <Button type="button" size="sm" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </CardContainer>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn('flex flex-col gap-1', full && 'sm:col-span-2')}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
