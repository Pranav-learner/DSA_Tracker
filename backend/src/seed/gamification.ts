import type { ActivityType, ActivityEntityType } from '../types/domain.js';

/**
 * Module 6 · Sprint 1 — back-dated demo events for the Progression Engine.
 *
 * These are *rewardable* Activity events spread across the last few weeks. The
 * seed inserts them as real (back-dated) Activity docs and then REPLAYS them
 * through the actual Reward Engine — so the demo user's XP, levels, streaks and
 * reward history are genuinely engine-produced, not hand-faked.
 *
 * The day layout deliberately contains a short early streak, a gap (to exercise
 * the "streak broken" path) and a long recent streak ending today, so every
 * streak transition is represented in the seeded history.
 */
export interface DemoRewardEvent {
  /** Whole days before today (0 = today) the event occurred. */
  daysAgo: number;
  /** Hour of day (UTC) — spreads multiple same-day events apart. */
  hour: number;
  type: ActivityType;
  entityType: ActivityEntityType;
  title: string;
  description: string;
}

export const DEMO_REWARD_EVENTS: DemoRewardEvent[] = [
  // ── Early 3-day streak (days 20–18) ───────────────────────────────
  { daysAgo: 20, hour: 9, type: 'problem-solved', entityType: 'problem', title: 'Solved Two Sum', description: 'Warmed up with a hashing classic.' },
  { daysAgo: 20, hour: 20, type: 'revision-completed', entityType: 'revision', title: 'Revised Sliding Window', description: 'Kept the pattern fresh.' },
  { daysAgo: 19, hour: 10, type: 'problem-solved', entityType: 'problem', title: 'Solved Valid Anagram', description: 'Frequency counting.' },
  { daysAgo: 19, hour: 21, type: 'notebook-created', entityType: 'problem', title: 'Documented Hashing', description: 'Wrote up the hashing pattern.' },
  { daysAgo: 18, hour: 11, type: 'problem-solved', entityType: 'problem', title: 'Solved Group Anagrams', description: 'Applied hashing again.' },
  // ── Gap (days 17–12) → streak breaks ──────────────────────────────
  // ── Long recent streak (days 11 → 0) ──────────────────────────────
  { daysAgo: 11, hour: 9, type: 'problem-solved', entityType: 'problem', title: 'Solved Binary Search', description: 'Back at it.' },
  { daysAgo: 11, hour: 19, type: 'revision-completed', entityType: 'revision', title: 'Revised Two Pointers', description: 'Spaced review.' },
  { daysAgo: 10, hour: 10, type: 'problem-solved', entityType: 'problem', title: 'Solved Search in Rotated Array', description: 'Binary search variant.' },
  { daysAgo: 10, hour: 12, type: 'topic-completed', entityType: 'topic', title: 'Completed Binary Search', description: 'Reached completion mastery.' },
  { daysAgo: 9, hour: 9, type: 'problem-solved', entityType: 'problem', title: 'Solved Koko Eating Bananas', description: 'Binary search on answer.' },
  { daysAgo: 9, hour: 20, type: 'notebook-updated', entityType: 'problem', title: 'Updated notes on Binary Search', description: 'Refined the template.' },
  { daysAgo: 8, hour: 11, type: 'problem-solved', entityType: 'problem', title: 'Solved Reverse Linked List', description: 'Pointer manipulation.' },
  { daysAgo: 8, hour: 15, type: 'revision-completed', entityType: 'revision', title: 'Revised Hashing', description: 'Spaced review.' },
  { daysAgo: 7, hour: 10, type: 'contest-finished', entityType: 'contest', title: 'Finished Weekly Contest 380', description: 'Solved 3/4 problems.' },
  { daysAgo: 7, hour: 22, type: 'upsolve-completed', entityType: 'contest', title: 'Upsolved the 4th problem', description: 'Closed the gap after the contest.' },
  { daysAgo: 6, hour: 9, type: 'problem-solved', entityType: 'problem', title: 'Solved Linked List Cycle', description: "Floyd's algorithm." },
  { daysAgo: 6, hour: 18, type: 'topic-completed', entityType: 'topic', title: 'Completed Linked Lists', description: 'Reached completion mastery.' },
  { daysAgo: 5, hour: 10, type: 'problem-solved', entityType: 'problem', title: 'Solved Merge Two Lists', description: 'Merging technique.' },
  { daysAgo: 5, hour: 20, type: 'revision-completed', entityType: 'revision', title: 'Revised Binary Search', description: 'Spaced review.' },
  { daysAgo: 4, hour: 11, type: 'problem-solved', entityType: 'problem', title: 'Solved Number of Islands', description: 'Grid DFS.' },
  { daysAgo: 4, hour: 16, type: 'notebook-created', entityType: 'problem', title: 'Documented Graph Traversal', description: 'BFS/DFS write-up.' },
  { daysAgo: 3, hour: 9, type: 'problem-solved', entityType: 'problem', title: 'Solved Course Schedule', description: 'Topological sort.' },
  { daysAgo: 3, hour: 12, type: 'topic-completed', entityType: 'topic', title: 'Completed Graph Traversal', description: 'Reached completion mastery.' },
  { daysAgo: 3, hour: 21, type: 'phase-completed', entityType: 'phase', title: 'Completed Phase: Core Patterns', description: 'A full phase of the roadmap, done.' },
  { daysAgo: 2, hour: 10, type: 'problem-solved', entityType: 'problem', title: 'Solved Clone Graph', description: 'Graph + hashing.' },
  { daysAgo: 2, hour: 19, type: 'revision-completed', entityType: 'revision', title: 'Revised Graph Traversal', description: 'Spaced review.' },
  { daysAgo: 1, hour: 10, type: 'contest-finished', entityType: 'contest', title: 'Finished Biweekly Contest 120', description: 'Clean run.' },
  { daysAgo: 1, hour: 11, type: 'problem-solved', entityType: 'problem', title: 'Solved Word Ladder', description: 'BFS shortest path.' },
  { daysAgo: 0, hour: 9, type: 'problem-solved', entityType: 'problem', title: 'Solved Rotting Oranges', description: 'Multi-source BFS.' },
  { daysAgo: 0, hour: 10, type: 'revision-completed', entityType: 'revision', title: 'Revised Linked Lists', description: "Today's review." },
];
