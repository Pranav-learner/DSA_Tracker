import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { ATTEMPT_STATUSES, ATTEMPT_VERDICTS, ATTEMPT_LANGUAGES } from '@/lib/attempts';
import { cn } from '@/lib/utils';
import type { Attempt, AttemptLanguage, AttemptStatus, AttemptVerdict } from '@/types';

const schema = z
  .object({
    status: z.enum(ATTEMPT_STATUSES as [AttemptStatus, ...AttemptStatus[]]),
    verdict: z.enum(ATTEMPT_VERDICTS as [AttemptVerdict, ...AttemptVerdict[]]),
    language: z.enum(ATTEMPT_LANGUAGES as [AttemptLanguage, ...AttemptLanguage[]]),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().optional(),
    wrongAttempts: z.coerce.number().int().min(0, 'Must be ≥ 0'),
    usedHint: z.boolean(),
    usedEditorial: z.boolean(),
    contestAttempt: z.boolean(),
    upsolved: z.boolean(),
    notes: z.string().max(5000).optional(),
  })
  .refine((d) => !d.endTime || new Date(d.startTime) <= new Date(d.endTime), {
    message: 'Start time must be before end time',
    path: ['endTime'],
  });

type FormValues = z.infer<typeof schema>;

/** Normalised payload the form emits (times as ISO strings). */
export interface AttemptFormPayload {
  status: AttemptStatus;
  verdict: AttemptVerdict;
  language: AttemptLanguage;
  startTime: string;
  endTime: string | null;
  wrongAttempts: number;
  usedHint: boolean;
  usedEditorial: boolean;
  contestAttempt: boolean;
  upsolved: boolean;
  notes: string;
}

interface AttemptFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AttemptFormPayload) => void;
  /** When set, the form is in edit mode and pre-filled. */
  attempt?: Attempt | null;
  isSubmitting?: boolean;
  errorMessage?: string;
}

const inputClass =
  'h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/40';

/** Create / edit an attempt. React Hook Form + Zod, inside the shared Modal. */
export function AttemptForm({ open, onClose, onSubmit, attempt, isSubmitting, errorMessage }: AttemptFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaultsFor(attempt) });

  // Re-seed the form whenever it opens (or the edited attempt changes).
  useEffect(() => {
    if (open) reset(defaultsFor(attempt));
  }, [open, attempt, reset]);

  const submit = handleSubmit((values) => {
    onSubmit({
      status: values.status,
      verdict: values.verdict,
      language: values.language,
      startTime: localToISO(values.startTime),
      endTime: values.endTime ? localToISO(values.endTime) : null,
      wrongAttempts: values.wrongAttempts,
      usedHint: values.usedHint,
      usedEditorial: values.usedEditorial,
      contestAttempt: values.contestAttempt,
      upsolved: values.upsolved,
      notes: values.notes ?? '',
    });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={attempt ? `Edit attempt #${attempt.attemptNumber}` : 'Log an attempt'}
      description="Record this step of your solving journey — it becomes permanent history."
    >
      <form onSubmit={submit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertTriangle className="size-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Status">
            <select className={inputClass} {...register('status')}>
              {ATTEMPT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Verdict">
            <select className={inputClass} {...register('verdict')}>
              {ATTEMPT_VERDICTS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Language">
            <select className={inputClass} {...register('language')}>
              {ATTEMPT_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Start time" error={errors.startTime?.message}>
            <input type="datetime-local" className={inputClass} {...register('startTime')} />
          </Field>
          <Field label="End time" error={errors.endTime?.message}>
            <input type="datetime-local" className={inputClass} {...register('endTime')} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Wrong attempts" error={errors.wrongAttempts?.message}>
            <input type="number" min={0} className={inputClass} {...register('wrongAttempts')} />
          </Field>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <Check label="Hint used" {...register('usedHint')} />
            <Check label="Editorial used" {...register('usedEditorial')} />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Check label="Contest attempt" {...register('contestAttempt')} />
          <Check label="Upsolved" {...register('upsolved')} />
        </div>

        <Field label="Notes">
          <textarea
            rows={3}
            placeholder="What happened? Approach, bug, insight…"
            className={cn(inputClass, 'h-auto resize-y py-2')}
            {...register('notes')}
          />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : attempt ? 'Save changes' : 'Log attempt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

// eslint-disable-next-line react/display-name
const Check = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="inline-flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      className="size-4 rounded border-border bg-card/60 accent-primary"
      {...props}
    />
    {label}
  </label>
);

/* ------------------------------ helpers ------------------------------- */

function defaultsFor(attempt?: Attempt | null): FormValues {
  if (attempt) {
    return {
      status: attempt.status,
      verdict: attempt.verdict,
      language: attempt.language,
      startTime: isoToLocal(attempt.startTime),
      endTime: attempt.endTime ? isoToLocal(attempt.endTime) : '',
      wrongAttempts: attempt.wrongAttempts,
      usedHint: attempt.usedHint,
      usedEditorial: attempt.usedEditorial,
      contestAttempt: attempt.contestAttempt,
      upsolved: attempt.upsolved,
      notes: attempt.notes,
    };
  }
  return {
    status: 'Started',
    verdict: 'Unknown',
    language: 'C++',
    startTime: toLocalInput(new Date()),
    endTime: '',
    wrongAttempts: 0,
    usedHint: false,
    usedEditorial: false,
    contestAttempt: false,
    upsolved: false,
    notes: '',
  };
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoToLocal(iso: string): string {
  return toLocalInput(new Date(iso));
}

function localToISO(local: string): string {
  return new Date(local).toISOString();
}
