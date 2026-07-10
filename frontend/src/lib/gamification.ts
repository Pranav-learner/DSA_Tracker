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
