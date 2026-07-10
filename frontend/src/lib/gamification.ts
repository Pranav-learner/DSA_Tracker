import {
  CheckCircle2,
  GraduationCap,
  Layers,
  CalendarClock,
  NotebookPen,
  Swords,
  Target,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { RewardSourceModule } from '@/types';

/** Visual metadata for a reward, keyed by its originating activity type. */
export interface RewardSourceMeta {
  label: string;
  icon: LucideIcon;
  module: RewardSourceModule;
}

const DEFAULT_META: RewardSourceMeta = { label: 'Reward', icon: Sparkles, module: 'learning' };

const REWARD_SOURCE_META: Record<string, RewardSourceMeta> = {
  'problem-solved': { label: 'Problem Solved', icon: CheckCircle2, module: 'learning' },
  'topic-completed': { label: 'Topic Completed', icon: GraduationCap, module: 'learning' },
  'phase-completed': { label: 'Phase Completed', icon: Layers, module: 'learning' },
  'revision-completed': { label: 'Revision Completed', icon: CalendarClock, module: 'revision' },
  'notebook-created': { label: 'Knowledge Entry', icon: NotebookPen, module: 'knowledge' },
  'notebook-updated': { label: 'Notebook Updated', icon: NotebookPen, module: 'knowledge' },
  'contest-finished': { label: 'Contest Completed', icon: Swords, module: 'contest' },
  'upsolve-completed': { label: 'Upsolve Completed', icon: Target, module: 'contest' },
};

/** Look up display metadata for a reward source (activity type). */
export function rewardSourceMeta(source: string): RewardSourceMeta {
  return REWARD_SOURCE_META[source] ?? DEFAULT_META;
}

/** All reward sources, for building filter menus. */
export function rewardSources(): { value: string; label: string }[] {
  return Object.entries(REWARD_SOURCE_META).map(([value, meta]) => ({ value, label: meta.label }));
}

/** Tailwind text-colour class per source module (matches the app tone scale). */
export const MODULE_TEXT: Record<RewardSourceModule, string> = {
  learning: 'text-primary',
  revision: 'text-warning',
  knowledge: 'text-success',
  contest: 'text-primary',
};

/** Tailwind bg/border tint per source module (for badges/icon chips). */
export const MODULE_TINT: Record<RewardSourceModule, string> = {
  learning: 'bg-primary/15 text-primary',
  revision: 'bg-warning/15 text-warning',
  knowledge: 'bg-success/15 text-success',
  contest: 'bg-primary/15 text-primary',
};

/** Human-friendly XP label, e.g. 1234 → "1,234 XP". */
export function formatXp(xp: number): string {
  return `${xp.toLocaleString()} XP`;
}

/** Compact XP, e.g. 1234 → "1.2k". */
export function compactXp(xp: number): string {
  if (xp < 1000) return String(xp);
  return `${(xp / 1000).toFixed(xp < 10_000 ? 1 : 0)}k`;
}

/* ------------------------------------------------------------------ *
 *  Sprint 2 — achievement / badge / challenge visual metadata
 * ------------------------------------------------------------------ */

import type { AchievementRarity, ChallengeType } from '@/types';

/** Rarity → styling tokens (border/text/glow) for cards + badges. */
export const RARITY_META: Record<AchievementRarity, { label: string; ring: string; text: string; chip: string; glow: string }> = {
  Common: { label: 'Common', ring: 'ring-border', text: 'text-muted-foreground', chip: 'bg-muted text-muted-foreground', glow: '' },
  Rare: { label: 'Rare', ring: 'ring-sky-500/40', text: 'text-sky-400', chip: 'bg-sky-500/15 text-sky-400', glow: 'shadow-[0_0_24px_-6px] shadow-sky-500/40' },
  Epic: { label: 'Epic', ring: 'ring-violet-500/40', text: 'text-violet-400', chip: 'bg-violet-500/15 text-violet-400', glow: 'shadow-[0_0_24px_-6px] shadow-violet-500/40' },
  Legendary: { label: 'Legendary', ring: 'ring-amber-500/50', text: 'text-amber-400', chip: 'bg-amber-500/15 text-amber-400', glow: 'shadow-[0_0_28px_-4px] shadow-amber-500/50' },
};

export const RARITY_ORDER: Record<AchievementRarity, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };

/** Challenge cadence → styling tokens + label. */
export const CHALLENGE_TYPE_META: Record<ChallengeType, { label: string; tint: string; text: string }> = {
  Daily: { label: 'Daily', tint: 'bg-primary/15 text-primary', text: 'text-primary' },
  Weekly: { label: 'Weekly', tint: 'bg-success/15 text-success', text: 'text-success' },
  Monthly: { label: 'Monthly', tint: 'bg-violet-500/15 text-violet-400', text: 'text-violet-400' },
  Phase: { label: 'Phase', tint: 'bg-amber-500/15 text-amber-400', text: 'text-amber-400' },
  Custom: { label: 'Custom', tint: 'bg-muted text-muted-foreground', text: 'text-muted-foreground' },
};

/** Format a seconds-remaining value as a compact "2d 4h" / "5h" / "12m" label. */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}
