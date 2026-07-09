import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { useSavePostmortem } from '@/hooks/useContestLearning';
import type { ContestPostmortem, UpsertPostmortemInput } from '@/types';

const inputClass =
  'w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30';

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const joined = (a: string[]) => a.join('\n');

/**
 * PostmortemEditor — structured contest reflection. Fields are markdown-friendly
 * textareas; lists are newline-separated. Saving upserts the postmortem.
 */
export function PostmortemEditor({ contestId, postmortem, onDone }: { contestId: string; postmortem: ContestPostmortem | null; onDone?: () => void }) {
  const save = useSavePostmortem(contestId);
  const [f, setF] = useState({
    overallPerformance: postmortem?.overallPerformance ?? '',
    whatWentWell: postmortem?.whatWentWell ?? '',
    whatWentWrong: postmortem?.whatWentWrong ?? '',
    biggestMistake: postmortem?.biggestMistake ?? '',
    biggestLearning: postmortem?.biggestLearning ?? '',
    nextFocus: postmortem?.nextFocus ?? '',
    timeManagementNotes: postmortem?.timeManagementNotes ?? '',
    strengths: joined(postmortem?.strengths ?? []),
    weaknesses: joined(postmortem?.weaknesses ?? []),
    missedPatterns: joined(postmortem?.missedPatterns ?? []),
    algorithmGaps: joined(postmortem?.algorithmGaps ?? []),
    learningGoals: joined((postmortem?.learningGoals ?? []).map((g) => g.text)),
  });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: UpsertPostmortemInput = {
      overallPerformance: f.overallPerformance,
      whatWentWell: f.whatWentWell,
      whatWentWrong: f.whatWentWrong,
      biggestMistake: f.biggestMistake,
      biggestLearning: f.biggestLearning,
      nextFocus: f.nextFocus,
      timeManagementNotes: f.timeManagementNotes,
      strengths: lines(f.strengths),
      weaknesses: lines(f.weaknesses),
      missedPatterns: lines(f.missedPatterns),
      algorithmGaps: lines(f.algorithmGaps),
      learningGoals: lines(f.learningGoals).map((text) => ({ text })),
    };
    save.mutate(input, { onSuccess: () => onDone?.() });
  };

  const Field = ({ label, k, rows = 2, placeholder }: { label: string; k: keyof typeof f; rows?: number; placeholder?: string }) => (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {rows === 1 ? (
        <input className={inputClass} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} />
      ) : (
        <textarea className={inputClass} rows={rows} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} />
      )}
    </label>
  );

  return (
    <CardContainer>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Overall performance" k="overallPerformance" rows={1} placeholder="e.g. Solid — solved A–C" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="What went well (markdown)" k="whatWentWell" />
          <Field label="What went wrong (markdown)" k="whatWentWrong" />
          <Field label="Biggest mistake" k="biggestMistake" />
          <Field label="Biggest learning" k="biggestLearning" />
          <Field label="Next focus" k="nextFocus" />
          <Field label="Time-management notes" k="timeManagementNotes" />
          <Field label="Strengths (one per line)" k="strengths" rows={3} />
          <Field label="Weaknesses (one per line)" k="weaknesses" rows={3} />
          <Field label="Missed patterns (one per line)" k="missedPatterns" rows={3} />
          <Field label="Algorithm gaps (one per line)" k="algorithmGaps" rows={3} />
        </div>
        <Field label="Learning goals (one per line)" k="learningGoals" rows={3} />
        <div className="flex items-center gap-2">
          {onDone && <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>}
          <Button type="submit" size="sm" disabled={save.isPending} className="ml-auto">
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save reflection
          </Button>
        </div>
        {save.isError && <p className="text-sm text-danger">Failed to save — please try again.</p>}
      </form>
    </CardContainer>
  );
}
