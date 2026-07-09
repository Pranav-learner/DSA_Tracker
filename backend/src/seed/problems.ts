import { slugify } from '../utils/slugify.js';
import { difficultyRank, type Difficulty, type Platform } from '../types/domain.js';
import type { TopicDocument } from '../models/Topic.js';
import type { IProblem } from '../models/Problem.js';
import { logger } from '../utils/logger.js';

/**
 * Problem Library seed.
 *
 * The catalog is built in two layers:
 *   1. **Representative problems** — flattened from every topic's curated
 *      `representativeProblems` (≈3 per topic → ~177), marked `representative`.
 *   2. **Extra practice problems** — a hand-picked set of well-known problems
 *      (below), marked non-representative, so the `representative` filter is
 *      meaningful and the "Greedy" pattern (which has no dedicated topic) is
 *      still covered.
 *
 * Everything resolves to a real phaseId/topicId, so the library is fully
 * organised across all phases and topics.
 */

interface ExtraProblem {
  /** Exact host-topic title (must exist in the seed) — sets phase/topic. */
  topicTitle: string;
  title: string;
  platform: Platform;
  difficulty: Difficulty;
  pattern: string;
  url: string;
  estimatedSolveTime: number;
  editorialUrl?: string;
  extraTags?: string[];
}

/** Curated non-representative practice problems, covering the 10 core patterns. */
export const EXTRA_PROBLEMS: ExtraProblem[] = [
  // Arrays
  { topicTitle: 'Array Fundamentals', title: 'Merge Sorted Array', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Arrays', url: 'https://leetcode.com/problems/merge-sorted-array/', estimatedSolveTime: 20 },
  { topicTitle: 'Array Fundamentals', title: 'Majority Element', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Boyer-Moore Voting', url: 'https://leetcode.com/problems/majority-element/', estimatedSolveTime: 20 },
  // Sliding Window
  { topicTitle: 'Sliding Window', title: 'Permutation in String', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Variable Window', url: 'https://leetcode.com/problems/permutation-in-string/', estimatedSolveTime: 30 },
  { topicTitle: 'Sliding Window', title: 'Fruit Into Baskets', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Variable Window', url: 'https://leetcode.com/problems/fruit-into-baskets/', estimatedSolveTime: 30 },
  // Prefix Sum
  { topicTitle: 'Prefix Sum', title: 'Find Pivot Index', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Prefix Sum', url: 'https://leetcode.com/problems/find-pivot-index/', estimatedSolveTime: 20 },
  { topicTitle: 'Prefix Sum', title: 'Contiguous Array', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Prefix + Hashing', url: 'https://leetcode.com/problems/contiguous-array/', estimatedSolveTime: 30 },
  // Binary Search
  { topicTitle: 'Binary Search', title: 'Search Insert Position', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Binary Search', url: 'https://leetcode.com/problems/search-insert-position/', estimatedSolveTime: 15 },
  { topicTitle: 'Binary Search', title: 'Find Minimum in Rotated Sorted Array', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Modified Binary Search', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', estimatedSolveTime: 30 },
  // Trees
  { topicTitle: 'Tree Traversals', title: 'Binary Tree Level Order Traversal', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Tree BFS', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', estimatedSolveTime: 25 },
  { topicTitle: 'Tree Traversals', title: 'Maximum Depth of Binary Tree', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Tree DFS', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', estimatedSolveTime: 15 },
  // Graphs
  { topicTitle: 'BFS & DFS', title: 'Flood Fill', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Grid DFS/BFS', url: 'https://leetcode.com/problems/flood-fill/', estimatedSolveTime: 20 },
  { topicTitle: 'Topological Sort', title: 'Course Schedule', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Topological Sort', url: 'https://leetcode.com/problems/course-schedule/', estimatedSolveTime: 35 },
  // Dynamic Programming
  { topicTitle: 'DP Foundations', title: 'Fibonacci Number', platform: 'LeetCode', difficulty: 'Easy', pattern: 'DP', url: 'https://leetcode.com/problems/fibonacci-number/', estimatedSolveTime: 15 },
  { topicTitle: '1D DP', title: 'Min Cost Climbing Stairs', platform: 'LeetCode', difficulty: 'Easy', pattern: '1D DP', url: 'https://leetcode.com/problems/min-cost-climbing-stairs/', estimatedSolveTime: 20 },
  // Greedy (no dedicated topic → hosted on Sorting Algorithms)
  { topicTitle: 'Sorting Algorithms', title: 'Assign Cookies', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Greedy', url: 'https://leetcode.com/problems/assign-cookies/', estimatedSolveTime: 20, extraTags: ['Greedy'] },
  { topicTitle: 'Sorting Algorithms', title: 'Jump Game', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Greedy', url: 'https://leetcode.com/problems/jump-game/', estimatedSolveTime: 30, extraTags: ['Greedy'] },
  { topicTitle: 'Sorting Algorithms', title: 'Gas Station', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Greedy', url: 'https://leetcode.com/problems/gas-station/', estimatedSolveTime: 35, extraTags: ['Greedy'] },
  // Strings
  { topicTitle: 'String Fundamentals', title: 'Valid Anagram', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Strings / Hashing', url: 'https://leetcode.com/problems/valid-anagram/', estimatedSolveTime: 15 },
  { topicTitle: 'String Fundamentals', title: 'Longest Common Prefix', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Strings', url: 'https://leetcode.com/problems/longest-common-prefix/', estimatedSolveTime: 20 },
  // Math
  { topicTitle: 'Number Theory', title: 'Count Primes', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Sieve of Eratosthenes', url: 'https://leetcode.com/problems/count-primes/', estimatedSolveTime: 30 },
  { topicTitle: 'Number Theory', title: 'Sqrt(x)', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Math / Binary Search', url: 'https://leetcode.com/problems/sqrtx/', estimatedSolveTime: 20 },
];

/** Derive a stable per-platform problem id from a URL's last path segment. */
function derivePlatformId(url: string, fallback: string): string {
  if (!url) return fallback;
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] || fallback;
}

function uniqueTags(tags: (string | undefined)[]): string[] {
  return [...new Set(tags.filter((t): t is string => Boolean(t)))];
}

/**
 * Build all Problem seed documents from the topics (with their embedded
 * representative problems) plus the curated extras. Slugs are made unique.
 */
export function buildProblemSeed(topics: TopicDocument[]): Partial<IProblem>[] {
  const byTitle = new Map(topics.map((t) => [t.title, t]));
  const usedSlugs = new Set<string>();
  const docs: Partial<IProblem>[] = [];

  const add = (input: {
    topic: TopicDocument;
    title: string;
    platform: Platform;
    difficulty: Difficulty;
    pattern: string;
    url: string;
    estimatedSolveTime: number;
    representative: boolean;
    tags: string[];
    editorialUrl?: string;
  }) => {
    const base = slugify(input.title);
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
    usedSlugs.add(slug);

    docs.push({
      title: input.title,
      slug,
      platform: input.platform,
      platformProblemId: derivePlatformId(input.url, base),
      url: input.url,
      difficulty: input.difficulty,
      difficultyRank: difficultyRank(input.difficulty),
      phaseId: input.topic.phaseId,
      topicId: input.topic._id,
      pattern: input.pattern,
      tags: input.tags,
      editorialUrl: input.editorialUrl,
      representative: input.representative,
      estimatedSolveTime: input.estimatedSolveTime,
    });
  };

  // 1. Representative problems from each topic's curated set.
  for (const topic of topics) {
    for (const rp of topic.representativeProblems) {
      add({
        topic,
        title: rp.name,
        platform: rp.platform,
        difficulty: rp.difficulty,
        pattern: rp.pattern,
        url: rp.url ?? '',
        estimatedSolveTime: rp.estimatedMinutes,
        representative: true,
        tags: uniqueTags([rp.pattern, topic.title, rp.difficulty]),
      });
    }
  }

  // 2. Curated extra practice problems (non-representative).
  for (const extra of EXTRA_PROBLEMS) {
    const topic = byTitle.get(extra.topicTitle);
    if (!topic) {
      logger.warn(`  ! extra problem references unknown topic: ${extra.topicTitle}`);
      continue;
    }
    add({
      topic,
      title: extra.title,
      platform: extra.platform,
      difficulty: extra.difficulty,
      pattern: extra.pattern,
      url: extra.url,
      estimatedSolveTime: extra.estimatedSolveTime,
      representative: false,
      editorialUrl: extra.editorialUrl,
      tags: uniqueTags([extra.pattern, topic.title, extra.difficulty, ...(extra.extraTags ?? [])]),
    });
  }

  return docs;
}

/** Topic titles whose problems are seeded as "Solved" for the demo user. */
export const DEMO_SOLVED_TOPICS = [
  'Environment & Toolchain',
  'Fast Input / Output',
  'Time & Space Complexity',
  'Problem-Solving Workflow',
  'Array Fundamentals',
  'Prefix Sum',
  'Difference Array',
  'Two Pointers',
];

/** Topic titles whose problems are seeded as "In Progress" for the demo user. */
export const DEMO_IN_PROGRESS_TOPICS = ['Sliding Window'];

/** Well-known problems favourited by the demo user. */
export const DEMO_FAVORITE_TITLES = [
  'Two Sum',
  'Maximum Subarray',
  'Number of Islands',
  'Climbing Stairs',
  'Binary Search',
  '3Sum',
];
