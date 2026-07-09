import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setContestPlatform,
  setContestType,
  setRatedOnly,
  resetContestFilters,
} from '@/store/slices/contestSlice';
import { PLATFORM_META, CONTEST_TYPE_META } from '@/lib/contest';
import { cn } from '@/lib/utils';
import type { ContestFacets, ContestPlatform, ContestType } from '@/types';

const PLATFORMS: ContestPlatform[] = ['Codeforces', 'LeetCode', 'AtCoder', 'CodeChef'];
const TYPES: ContestType[] = ['Rated', 'Unrated', 'Virtual'];

/** Data-driven contest filter bar (platform · type · rated) wired to Redux. */
export function ContestFilterBar({ facets }: { facets?: ContestFacets }) {
  const dispatch = useAppDispatch();
  const { platform, contestType, ratedOnly } = useAppSelector((s) => s.contest);
  const active = platform || contestType || ratedOnly !== null;
  const usable = facets?.usedPlatforms;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/40 p-3">
      <span className="text-xs font-medium text-muted-foreground">Platform</span>
      {PLATFORMS.filter((p) => !usable || usable.length === 0 || usable.includes(p)).map((p) => (
        <Chip key={p} label={PLATFORM_META[p].label} active={platform === p} onClick={() => dispatch(setContestPlatform(p))} />
      ))}
      <span className="mx-1 h-4 w-px bg-border" />
      <span className="text-xs font-medium text-muted-foreground">Type</span>
      {TYPES.map((t) => (
        <Chip key={t} label={CONTEST_TYPE_META[t].label} active={contestType === t} onClick={() => dispatch(setContestType(t))} />
      ))}
      <span className="mx-1 h-4 w-px bg-border" />
      <Chip label="Rated only" active={ratedOnly === true} onClick={() => dispatch(setRatedOnly(ratedOnly === true ? null : true))} />

      {active && (
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => dispatch(resetContestFilters())}>
          <X className="size-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="focus:outline-none">
      <Badge variant={active ? 'primary' : 'outline'} className={cn('cursor-pointer')}>
        {label}
      </Badge>
    </button>
  );
}
