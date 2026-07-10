import { useMemo } from 'react';
import { Trophy, Search, RotateCcw } from 'lucide-react';
import { useAchievements } from '@/hooks/useGamification';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setAchievementCategory,
  setAchievementRarity,
  setAchievementView,
  setAchievementSort,
  setAchievementSearch,
  resetAchievementFilters,
  type AchievementSort,
  type GamificationUiState,
} from '@/store/slices/gamificationSlice';
import { AchievementCard } from '@/components/gamification';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RARITY_META, RARITY_ORDER } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { Achievement, AchievementRarity } from '@/types';

const RARITIES = Object.keys(RARITY_META) as AchievementRarity[];
const SORTS: { value: AchievementSort; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'progress', label: 'Progress' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'recent', label: 'Recently unlocked' },
];

/**
 * Achievements page — the full catalogue with locked/unlocked cards, plus
 * category / rarity / view filters, search and sort (all UI state in the
 * gamification Redux slice; the catalogue is server-owned by React Query).
 */
export function AchievementsPage() {
  const dispatch = useAppDispatch();
  const ui = useAppSelector((s) => s.gamification);
  const { data, isLoading, isError, error, refetch } = useAchievements();

  const categories = useMemo(
    () => Array.from(new Set((data ?? []).map((a) => a.category))).sort(),
    [data],
  );

  const filtered = useMemo(() => applyFilters(data ?? [], ui), [data, ui]);
  const unlockedCount = (data ?? []).filter((a) => a.unlocked).length;

  if (isLoading) return <AchievementsSkeleton />;
  if (isError || !data) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Module 6 · Gamification"
        title="Achievements"
        description="Milestones you unlock automatically as you learn."
        icon={<Trophy className="size-5" />}
        action={
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-medium tabular-nums">
            {unlockedCount}/{data.length} unlocked
          </span>
        }
      />

      {/* Filter bar */}
      <div className="space-y-3 rounded-lg border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={ui.achievementSearch}
              onChange={(e) => dispatch(setAchievementSearch(e.target.value))}
              placeholder="Search achievements…"
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <ViewToggle value={ui.achievementView} onChange={(v) => dispatch(setAchievementView(v))} />
          <select
            value={ui.achievementSort}
            onChange={(e) => dispatch(setAchievementSort(e.target.value as AchievementSort))}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/50"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={() => dispatch(resetAchievementFilters())}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Chip key={cat} active={ui.achievementCategory === cat} onClick={() => dispatch(setAchievementCategory(cat))}>
              {cat}
            </Chip>
          ))}
          <span className="mx-1 w-px self-stretch bg-border" />
          {RARITIES.map((r) => (
            <Chip
              key={r}
              active={ui.achievementRarity === r}
              onClick={() => dispatch(setAchievementRarity(r))}
              className={ui.achievementRarity === r ? RARITY_META[r].chip : undefined}
            >
              {r}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Trophy className="size-5" />} title="No achievements match" description="Try clearing a filter or search term." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((a) => (
            <AchievementCard key={a.achievementKey} achievement={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function applyFilters(items: Achievement[], ui: GamificationUiState): Achievement[] {
  let out = items;
  if (ui.achievementCategory) out = out.filter((a) => a.category === ui.achievementCategory);
  if (ui.achievementRarity) out = out.filter((a) => a.rarity === ui.achievementRarity);
  if (ui.achievementView === 'unlocked') out = out.filter((a) => a.unlocked);
  if (ui.achievementView === 'locked') out = out.filter((a) => !a.unlocked);
  if (ui.achievementSearch.trim()) {
    const q = ui.achievementSearch.toLowerCase();
    out = out.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  }

  const sorted = [...out];
  switch (ui.achievementSort) {
    case 'progress':
      sorted.sort((a, b) => b.percent - a.percent);
      break;
    case 'rarity':
      sorted.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
      break;
    case 'recent':
      sorted.sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''));
      break;
    default:
      // Unlocked first, then by progress.
      sorted.sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.percent - a.percent);
  }
  return sorted;
}

function Chip({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        active ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        active && className,
      )}
    >
      {children}
    </button>
  );
}

function ViewToggle({ value, onChange }: { value: 'all' | 'unlocked' | 'locked'; onChange: (v: 'all' | 'unlocked' | 'locked') => void }) {
  const opts: { value: 'all' | 'unlocked' | 'locked'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unlocked', label: 'Unlocked' },
    { value: 'locked', label: 'Locked' },
  ];
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-colors',
            value === o.value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AchievementsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full max-w-md rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
