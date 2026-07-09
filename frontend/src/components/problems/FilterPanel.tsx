import { SlidersHorizontal, Star, Sparkles, X } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { useProblemFacets } from '@/hooks/useProblems';
import { useRoadmap } from '@/hooks/useRoadmap';
import { usePhaseTopics } from '@/hooks/usePhase';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFilter, resetFilters } from '@/store/slices/problemsSlice';
import type { ProblemFilters } from '@/store/slices/problemsSlice';
import { cn } from '@/lib/utils';

/**
 * Data-driven filter panel. Options come from the backend facets + roadmap, so
 * the panel never hard-codes catalog values. All state lives in the problems
 * slice (UI state); changing a filter re-runs the React Query list.
 */
export function FilterPanel() {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((s) => s.problems);
  const { data: facets } = useProblemFacets();
  const { data: roadmap } = useRoadmap();
  const { data: phaseTopics } = usePhaseTopics(filters.phase ?? undefined);

  const set = <K extends keyof ProblemFilters>(key: K, value: ProblemFilters[K]) =>
    dispatch(setFilter({ key, value }));

  const activeCount = countActive(filters);

  return (
    <CardContainer className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-primary" /> Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => dispatch(resetFilters())}>
            <X className="size-3.5" /> Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FilterSelect
          label="Platform"
          value={filters.platform}
          onChange={(v) => set('platform', v as ProblemFilters['platform'])}
          options={(facets?.platforms ?? []).map((p) => ({ value: p, label: p }))}
        />
        <FilterSelect
          label="Difficulty"
          value={filters.difficulty}
          onChange={(v) => set('difficulty', v as ProblemFilters['difficulty'])}
          options={(facets?.difficulties ?? []).map((d) => ({ value: d, label: d }))}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => set('status', v as ProblemFilters['status'])}
          options={(facets?.statuses ?? []).map((s) => ({ value: s, label: s }))}
        />
        <FilterSelect
          label="Phase"
          value={filters.phase}
          onChange={(v) => {
            set('phase', v);
            set('topic', null); // topic depends on phase — clear on change
          }}
          options={(roadmap?.phases ?? []).map((p) => ({ value: p.id, label: `P${p.order} · ${p.title}` }))}
        />
        <FilterSelect
          label="Topic"
          value={filters.topic}
          disabled={!filters.phase}
          placeholder={filters.phase ? 'All' : 'Pick a phase'}
          onChange={(v) => set('topic', v)}
          options={(phaseTopics ?? []).map((t) => ({ value: t.id, label: t.title }))}
        />
        <FilterSelect
          label="Pattern"
          value={filters.pattern}
          onChange={(v) => set('pattern', v)}
          options={(facets?.patterns ?? []).map((p) => ({ value: p, label: p }))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <ToggleChip
          active={filters.representative === true}
          onClick={() => set('representative', filters.representative === true ? null : true)}
          icon={<Sparkles className="size-3.5" />}
        >
          Representative only
        </ToggleChip>
        <ToggleChip
          active={filters.favorite}
          onClick={() => set('favorite', !filters.favorite)}
          icon={<Star className="size-3.5" />}
        >
          Favorites only
        </ToggleChip>
      </div>
    </CardContainer>
  );
}

interface Option {
  value: string;
  label: string;
}

function FilterSelect({
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

function ToggleChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function countActive(filters: ProblemFilters): number {
  let n = 0;
  if (filters.platform) n++;
  if (filters.difficulty) n++;
  if (filters.status) n++;
  if (filters.phase) n++;
  if (filters.topic) n++;
  if (filters.pattern) n++;
  if (filters.representative === true) n++;
  if (filters.favorite) n++;
  return n;
}
