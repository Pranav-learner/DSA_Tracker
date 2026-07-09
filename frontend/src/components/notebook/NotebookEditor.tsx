import { useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, Hash, Eye, Cpu, Lightbulb, GraduationCap, StickyNote, ListTree } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { ConfidenceSlider } from './ConfidenceSlider';
import { cn } from '@/lib/utils';
import type { NotebookDetail, UpdateNotebookInput } from '@/types';

interface NotebookEditorProps {
  entry: NotebookDetail;
  onSave: (patch: UpdateNotebookInput) => void;
}

interface EditorValues {
  recognitionKeywords: string;
  observation: string;
  coreAlgorithm: string;
  timeComplexity: string;
  spaceComplexity: string;
  commonMistakes: string;
  lessonsLearned: string;
  personalNotes: string;
  confidence: number;
  alternativeSolutions: { title: string; detail: string }[];
}

const inputClass =
  'w-full rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/40';

/**
 * Notebook editor — all sections in one auto-saving form (React Hook Form).
 * Changes are debounced (800ms) and persisted via `onSave`; no explicit submit
 * is required, though "Save now" forces an immediate write.
 */
export function NotebookEditor({ entry, onSave }: NotebookEditorProps) {
  const { register, control, watch, getValues } = useForm<EditorValues>({
    defaultValues: toEditorValues(entry),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'alternativeSolutions' });

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const save = (vals: EditorValues) => onSave(toPatch(vals));

  // Debounced auto-save on any change (RHF watch callback → no re-render churn).
  useEffect(() => {
    const sub = watch((vals) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => save(vals as EditorValues), 800);
    });
    return () => {
      sub.unsubscribe();
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  return (
    <div className="space-y-4">
      <Section icon={<Cpu className="size-4" />} title="Confidence">
        <Controller
          control={control}
          name="confidence"
          render={({ field }) => (
            <ConfidenceSlider value={field.value} onChange={field.onChange} label="How confident are you?" />
          )}
        />
      </Section>

      <Section icon={<Hash className="size-4" />} title="Recognition Keywords" hint="One per line (or comma-separated)">
        <textarea rows={3} className={inputClass} {...register('recognitionKeywords')} />
      </Section>

      <Section icon={<Eye className="size-4" />} title="Observation">
        <textarea rows={3} className={inputClass} {...register('observation')} />
      </Section>

      <Section icon={<ListTree className="size-4" />} title="Core Algorithm">
        <textarea rows={4} className={inputClass} {...register('coreAlgorithm')} />
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section icon={<Cpu className="size-4" />} title="Time Complexity">
          <input className={cn(inputClass, 'font-mono')} placeholder="O(n)" {...register('timeComplexity')} />
        </Section>
        <Section icon={<Cpu className="size-4" />} title="Space Complexity">
          <input className={cn(inputClass, 'font-mono')} placeholder="O(1)" {...register('spaceComplexity')} />
        </Section>
      </div>

      <Section icon={<ListTree className="size-4" />} title="Alternative Solutions">
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex flex-col gap-2 rounded-lg border border-border bg-accent/20 p-2.5 sm:flex-row">
              <input
                className={cn(inputClass, 'sm:w-1/3')}
                placeholder="Approach"
                {...register(`alternativeSolutions.${i}.title` as const)}
              />
              <input
                className={inputClass}
                placeholder="Trade-off / detail"
                {...register(`alternativeSolutions.${i}.detail` as const)}
              />
              <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => remove(i)} aria-label="Remove">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => append({ title: '', detail: '' })}>
            <Plus className="size-4" /> Add alternative
          </Button>
        </div>
      </Section>

      <Section icon={<Lightbulb className="size-4" />} title="Common Mistakes" hint="One per line">
        <textarea rows={3} className={inputClass} {...register('commonMistakes')} />
      </Section>

      <Section icon={<GraduationCap className="size-4" />} title="Lessons Learned">
        <textarea rows={3} className={inputClass} {...register('lessonsLearned')} />
      </Section>

      <Section icon={<StickyNote className="size-4" />} title="Personal Notes">
        <textarea rows={3} className={inputClass} {...register('personalNotes')} />
      </Section>

      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => save(getValues())}>
          Save now
        </Button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <CardContainer className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        </div>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </CardContainer>
  );
}

/* ------------------------------ conversions ------------------------------ */

function toEditorValues(entry: NotebookDetail): EditorValues {
  return {
    recognitionKeywords: entry.recognitionKeywords.join('\n'),
    observation: entry.observation,
    coreAlgorithm: entry.coreAlgorithm,
    timeComplexity: entry.timeComplexity,
    spaceComplexity: entry.spaceComplexity,
    commonMistakes: entry.commonMistakes.join('\n'),
    lessonsLearned: entry.lessonsLearned,
    personalNotes: entry.personalNotes,
    confidence: entry.confidence,
    alternativeSolutions: entry.alternativeSolutions.map((a) => ({ title: a.title, detail: a.detail })),
  };
}

function toPatch(vals: EditorValues): UpdateNotebookInput {
  return {
    recognitionKeywords: splitList(vals.recognitionKeywords),
    observation: vals.observation,
    coreAlgorithm: vals.coreAlgorithm,
    timeComplexity: vals.timeComplexity,
    spaceComplexity: vals.spaceComplexity,
    commonMistakes: splitLines(vals.commonMistakes),
    lessonsLearned: vals.lessonsLearned,
    personalNotes: vals.personalNotes,
    confidence: vals.confidence,
    alternativeSolutions: (vals.alternativeSolutions ?? [])
      .filter((a) => a.title.trim())
      .map((a) => ({ title: a.title.trim(), detail: (a.detail ?? '').trim() })),
  };
}

const splitLines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const splitList = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
