import { SlidersHorizontal, X } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { useNotebookFacets } from '@/hooks/useNotebook';
import { useRoadmap } from '@/hooks/useRoadmap';
import { usePhaseTopics } from '@/hooks/usePhase';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNotebookFilter, resetNotebookFilters } from '@/store/slices/notebookSlice';
import type { NotebookFilters as Filters } from '@/store/slices/notebookSlice';

const CONFIDENCE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '40', label: '≥ 40%' },
  { value: '60', label: '≥ 60%' },
  { value: '80', label: '≥ 80%' },
  { value: '90', label: '≥ 90%' },
];

/** Data-driven notebook filters (pattern / topic / phase / platform / confidence). */
export function NotebookFilters() {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((s) => s.notebook);
  const { data: facets } = useNotebookFacets();
  const { data: roadmap } = useRoadmap();
  const { data: phaseTopics } = usePhaseTopics(filters.phase ?? undefined);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    dispatch(setNotebookFilter({ key, value }));

  const active = countActive(filters);

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-primary" /> Filters
          {active > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
              {active}
            </span>
          )}
        </div>
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={() => dispatch(resetNotebookFilters())}>
            <X className="size-3.5" /> Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Select
          label="Pattern"
          value={filters.pattern}
          onChange={(v) => set('pattern', v)}
          options={(facets?.patterns ?? []).map((p) => ({ value: p, label: p }))}
        />
        <Select
          label="Platform"
          value={filters.platform}
          onChange={(v) => set('platform', v as Filters['platform'])}
          options={(facets?.platforms ?? []).map((p) => ({ value: p, label: p }))}
        />
        <Select
          label="Phase"
          value={filters.phase}
          onChange={(v) => {
            set('phase', v);
            set('topic', null);
          }}
          options={(roadmap?.phases ?? []).map((p) => ({ value: p.id, label: `P${p.order} · ${p.title}` }))}
        />
        <Select
          label="Topic"
          value={filters.topic}
          disabled={!filters.phase}
          placeholder={filters.phase ? 'All' : 'Pick a phase'}
          onChange={(v) => set('topic', v)}
          options={(phaseTopics ?? []).map((t) => ({ value: t.id, label: t.title }))}
        />
        <Select
          label="Min confidence"
          value={filters.confidenceMin === null ? '' : String(filters.confidenceMin)}
          onChange={(v) => set('confidenceMin', v ? Number(v) : null)}
          options={CONFIDENCE_OPTIONS.slice(1)}
          placeholder="Any"
        />
      </div>
    </CardContainer>
  );
}

interface Option {
  value: string;
  label: string;
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
  disabled,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-9 rounded-md border border-border bg-card/60 px-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function countActive(filters: Filters): number {
  return Object.values(filters).filter((v) => v !== null).length;
}
