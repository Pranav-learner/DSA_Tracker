import { count, titlesMatching, type RuleContext } from './achievements.js';
import type { GamificationCategory } from '../types/domain.js';

/**
 * Badge catalogue (Module 6 · Sprint 2). Badges are the collectible face of
 * progression — simpler than achievements (unlock/locked, no progress bar). A
 * badge unlocks either from its own metric condition here, or because an
 * achievement lists it as `badgeKey` (the AchievementService unlocks it on
 * unlock). Both paths funnel through BadgeService, so a badge is never awarded
 * twice (unique {userId, badgeKey}).
 */
export interface BadgeDef {
  key: string;
  title: string;
  description: string;
  category: GamificationCategory;
  icon: string;
  /** Self-standing unlock condition, evaluated on every activity event. */
  unlocked: (ctx: RuleContext) => boolean;
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    key: 'contest-veteran',
    title: 'Contest Veteran',
    description: 'Finished 5 or more contests.',
    category: 'Contests',
    icon: '🏆',
    unlocked: (c) => count(c, 'contest-finished') >= 5,
  },
  {
    key: 'knowledge-builder',
    title: 'Knowledge Builder',
    description: 'Created 5 or more knowledge entries.',
    category: 'Knowledge',
    icon: '📚',
    unlocked: (c) => count(c, 'notebook-created') >= 5,
  },
  {
    key: 'speed-solver',
    title: 'Speed Solver',
    description: 'Solved 25 or more problems.',
    category: 'Problems',
    icon: '⚡',
    unlocked: (c) => count(c, 'problem-solved') >= 25,
  },
  {
    key: 'streak-master',
    title: 'Streak Master',
    description: 'Reached a 30-day learning streak.',
    category: 'Streak',
    icon: '🔥',
    unlocked: (c) => c.progression.longestStreak >= 30,
  },
  {
    key: 'pattern-hunter',
    title: 'Pattern Hunter',
    description: 'Documented 10 or more patterns.',
    category: 'Knowledge',
    icon: '🧠',
    unlocked: (c) => count(c, 'notebook-created') >= 10,
  },
  {
    key: 'phase-conqueror',
    title: 'Phase Conqueror',
    description: 'Completed a full roadmap phase.',
    category: 'Progression',
    icon: '🚀',
    unlocked: (c) => count(c, 'phase-completed') >= 1,
  },
  {
    key: 'graph-guru',
    title: 'Graph Guru',
    description: 'Solved 5 graph problems.',
    category: 'Mastery',
    icon: '🕸️',
    unlocked: (c) =>
      titlesMatching(c, 'problem-solved', ['graph', 'island', 'bfs', 'dfs', 'course', 'clone', 'ladder', 'rotting']) >= 5,
  },
];

/** Fast lookup by key (used when an achievement unlocks its linked badge). */
export const BADGE_BY_KEY: Record<string, BadgeDef> = Object.fromEntries(
  BADGE_DEFS.map((b) => [b.key, b]),
);
