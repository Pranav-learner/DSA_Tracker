import type { Difficulty } from '../types/domain.js';

/**
 * Seed definitions for the full Competitive Programming roadmap.
 * Icons use lucide-react names so the frontend can render them directly.
 */
export interface TopicSeed {
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedHours: number;
  estimatedProblems: number;
}

export interface PhaseSeed {
  title: string;
  order: number;
  description: string;
  icon: string;
  estimatedWeeks: number;
  color: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  topics: TopicSeed[];
}

export const roadmapSeed: PhaseSeed[] = [
  {
    title: 'Competitive Programming Setup',
    order: 0,
    description:
      'Get battle-ready: toolchain, fast I/O, complexity analysis and a repeatable problem-solving workflow before touching real algorithms.',
    icon: 'terminal',
    estimatedWeeks: 1,
    color: '#64748b',
    isUnlocked: true,
    isCompleted: false,
    topics: [
      {
        title: 'Environment & Toolchain',
        description: 'Editor, compiler flags, templates, stress-testing scripts and a competitive setup that scales.',
        difficulty: 'Beginner',
        estimatedHours: 3,
        estimatedProblems: 0,
      },
      {
        title: 'Fast Input / Output',
        description: 'Buffered I/O, sync_with_stdio, and reading large inputs without TLE.',
        difficulty: 'Beginner',
        estimatedHours: 2,
        estimatedProblems: 4,
      },
      {
        title: 'Time & Space Complexity',
        description: 'Big-O, amortised analysis and estimating whether a solution fits the constraints.',
        difficulty: 'Easy',
        estimatedHours: 4,
        estimatedProblems: 8,
      },
      {
        title: 'Problem-Solving Workflow',
        description: 'Reading statements, spotting constraints, brute force → optimise, and debugging under pressure.',
        difficulty: 'Beginner',
        estimatedHours: 3,
        estimatedProblems: 5,
      },
    ],
  },
  {
    title: 'Arrays & Linear Patterns',
    order: 1,
    description:
      'The workhorse patterns that appear in half of all interview and contest problems: prefix sums, windows and pointers.',
    icon: 'brackets',
    estimatedWeeks: 3,
    color: '#6366f1',
    isUnlocked: true,
    isCompleted: false,
    topics: [
      {
        title: 'Array Fundamentals',
        description: 'Traversal, in-place manipulation, rotations and the mental model of contiguous memory.',
        difficulty: 'Easy',
        estimatedHours: 5,
        estimatedProblems: 12,
      },
      {
        title: 'Prefix Sum',
        description: 'Precompute cumulative sums for O(1) range queries; 1D and 2D variants.',
        difficulty: 'Easy',
        estimatedHours: 4,
        estimatedProblems: 10,
      },
      {
        title: 'Difference Array',
        description: 'Efficient range updates with a companion prefix sum for offline query batches.',
        difficulty: 'Medium',
        estimatedHours: 3,
        estimatedProblems: 8,
      },
      {
        title: 'Two Pointers',
        description: 'Opposite-end and same-direction pointers for pair, subarray and partition problems.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 14,
      },
      {
        title: 'Sliding Window',
        description: 'Fixed and variable-size windows for subarray sum, distinct counts and constraints.',
        difficulty: 'Medium',
        estimatedHours: 6,
        estimatedProblems: 16,
      },
      {
        title: "Kadane's Algorithm",
        description: 'Maximum subarray sum and its variants — the canonical linear DP on arrays.',
        difficulty: 'Medium',
        estimatedHours: 3,
        estimatedProblems: 7,
      },
      {
        title: 'Binary Search on Answer',
        description: 'Monotonic predicate search over the answer space (minimise-the-maximum problems).',
        difficulty: 'Hard',
        estimatedHours: 6,
        estimatedProblems: 12,
      },
    ],
  },
  {
    title: 'Searching & Core Data Structures',
    order: 2,
    description:
      'Master ordered search and the everyday containers — stacks, queues, hashing and heaps — that power everything above.',
    icon: 'search',
    estimatedWeeks: 4,
    color: '#0ea5e9',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'Binary Search',
        description: 'Lower/upper bound, boundary conditions and search on sorted structures.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 14,
      },
      {
        title: 'Sorting Algorithms',
        description: 'Comparison sorts, counting/radix sort and custom comparators.',
        difficulty: 'Easy',
        estimatedHours: 4,
        estimatedProblems: 10,
      },
      {
        title: 'Stacks & Monotonic Stack',
        description: 'Next-greater-element, histogram and span problems using monotonic invariants.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 12,
      },
      {
        title: 'Queues & Deque',
        description: 'FIFO processing, sliding-window maximum and monotonic deque.',
        difficulty: 'Medium',
        estimatedHours: 4,
        estimatedProblems: 9,
      },
      {
        title: 'Hashing',
        description: 'Hash maps/sets, frequency counting and collision-aware design.',
        difficulty: 'Easy',
        estimatedHours: 4,
        estimatedProblems: 12,
      },
      {
        title: 'Heaps & Priority Queues',
        description: 'Binary heaps, top-K patterns and k-way merging.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 11,
      },
    ],
  },
  {
    title: 'Recursion & Combinatorial Thinking',
    order: 3,
    description:
      'Think recursively: build the call tree, prune it, and enumerate combinatorial spaces without drowning in them.',
    icon: 'git-branch',
    estimatedWeeks: 3,
    color: '#8b5cf6',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'Recursion Fundamentals',
        description: 'Base cases, recursion trees, the call stack and translating loops to recursion.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 12,
      },
      {
        title: 'Backtracking',
        description: 'Systematic search with undo: permutations, subsets, and constraint satisfaction.',
        difficulty: 'Hard',
        estimatedHours: 7,
        estimatedProblems: 15,
      },
      {
        title: 'Subsets & Permutations',
        description: 'Generating combinatorial objects and handling duplicates cleanly.',
        difficulty: 'Medium',
        estimatedHours: 4,
        estimatedProblems: 10,
      },
      {
        title: 'Divide & Conquer',
        description: 'Split-solve-combine, the master theorem and merge-style recurrences.',
        difficulty: 'Hard',
        estimatedHours: 5,
        estimatedProblems: 9,
      },
      {
        title: 'Recursion to Iteration',
        description: 'Converting recursion to explicit stacks and reasoning about tail calls.',
        difficulty: 'Medium',
        estimatedHours: 3,
        estimatedProblems: 6,
      },
    ],
  },
  {
    title: 'Trees',
    order: 4,
    description:
      'Hierarchical data: traversal orders, binary search trees and the tree-DP that unlocks graph thinking.',
    icon: 'network',
    estimatedWeeks: 4,
    color: '#22c55e',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'Tree Traversals',
        description: 'Pre/in/post-order and level-order, recursive and iterative.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 14,
      },
      {
        title: 'Binary Search Trees',
        description: 'BST invariants, insertion/deletion and validation.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 11,
      },
      {
        title: 'Lowest Common Ancestor',
        description: 'LCA via parent pointers, Euler tour and binary lifting.',
        difficulty: 'Hard',
        estimatedHours: 5,
        estimatedProblems: 8,
      },
      {
        title: 'Tree DP',
        description: 'Dynamic programming on rooted trees: subtree aggregates and rerooting.',
        difficulty: 'Hard',
        estimatedHours: 7,
        estimatedProblems: 12,
      },
      {
        title: 'Binary Trees & Views',
        description: 'Diameter, views, balanced-tree checks and reconstruction.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 13,
      },
    ],
  },
  {
    title: 'Graphs',
    order: 5,
    description:
      'The most versatile model in CP: traversal, shortest paths, connectivity and the classic graph algorithms.',
    icon: 'share-2',
    estimatedWeeks: 5,
    color: '#14b8a6',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'Graph Representation',
        description: 'Adjacency list/matrix, weighted/directed graphs and building from input.',
        difficulty: 'Easy',
        estimatedHours: 3,
        estimatedProblems: 6,
      },
      {
        title: 'BFS & DFS',
        description: 'Traversal, connected components, cycle detection and grid problems.',
        difficulty: 'Medium',
        estimatedHours: 6,
        estimatedProblems: 16,
      },
      {
        title: 'Topological Sort',
        description: 'Kahn’s algorithm and DFS ordering for dependency resolution.',
        difficulty: 'Medium',
        estimatedHours: 4,
        estimatedProblems: 9,
      },
      {
        title: 'Shortest Paths',
        description: 'Dijkstra, Bellman-Ford and 0-1 BFS with correct edge handling.',
        difficulty: 'Hard',
        estimatedHours: 8,
        estimatedProblems: 14,
      },
      {
        title: 'Minimum Spanning Tree',
        description: 'Kruskal and Prim, with union-find for connectivity.',
        difficulty: 'Hard',
        estimatedHours: 5,
        estimatedProblems: 8,
      },
      {
        title: 'Union-Find (DSU)',
        description: 'Disjoint set union with path compression and union by rank.',
        difficulty: 'Medium',
        estimatedHours: 4,
        estimatedProblems: 10,
      },
    ],
  },
  {
    title: 'Dynamic Programming',
    order: 6,
    description:
      'From memoised recursion to slick tabulation across the canonical DP families that decide most hard problems.',
    icon: 'layers',
    estimatedWeeks: 6,
    color: '#f59e0b',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'DP Foundations',
        description: 'State design, transitions, memoisation vs tabulation and complexity.',
        difficulty: 'Hard',
        estimatedHours: 6,
        estimatedProblems: 12,
      },
      {
        title: '1D DP',
        description: 'Fibonacci-style, house robber and decode-ways patterns.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 12,
      },
      {
        title: 'Knapsack Patterns',
        description: '0/1, unbounded and subset-sum variants.',
        difficulty: 'Hard',
        estimatedHours: 6,
        estimatedProblems: 12,
      },
      {
        title: 'Grid & 2D DP',
        description: 'Path counting, edit distance and LCS-style tables.',
        difficulty: 'Hard',
        estimatedHours: 6,
        estimatedProblems: 13,
      },
      {
        title: 'DP on Subsequences',
        description: 'LIS, LCS and their O(n log n) refinements.',
        difficulty: 'Hard',
        estimatedHours: 6,
        estimatedProblems: 11,
      },
      {
        title: 'Bitmask DP',
        description: 'State compression over subsets for TSP-style problems.',
        difficulty: 'Expert',
        estimatedHours: 7,
        estimatedProblems: 9,
      },
    ],
  },
  {
    title: 'Advanced Data Structures',
    order: 7,
    description:
      'The heavy machinery: segment trees, Fenwick trees and range-query structures that make hard problems tractable.',
    icon: 'boxes',
    estimatedWeeks: 5,
    color: '#ec4899',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'Fenwick Tree (BIT)',
        description: 'Point update / prefix query in O(log n); inversions and frequencies.',
        difficulty: 'Hard',
        estimatedHours: 5,
        estimatedProblems: 10,
      },
      {
        title: 'Segment Tree',
        description: 'Range queries and point updates with associative merges.',
        difficulty: 'Hard',
        estimatedHours: 7,
        estimatedProblems: 12,
      },
      {
        title: 'Lazy Propagation',
        description: 'Range updates on segment trees with deferred pushes.',
        difficulty: 'Expert',
        estimatedHours: 6,
        estimatedProblems: 8,
      },
      {
        title: 'Sparse Table',
        description: 'Immutable O(1) idempotent range queries (RMQ) after O(n log n) build.',
        difficulty: 'Hard',
        estimatedHours: 4,
        estimatedProblems: 6,
      },
      {
        title: 'Trie',
        description: 'Prefix trees for string sets and XOR-maximisation problems.',
        difficulty: 'Medium',
        estimatedHours: 5,
        estimatedProblems: 9,
      },
    ],
  },
  {
    title: 'String Algorithms',
    order: 8,
    description:
      'Pattern matching, hashing and suffix structures — the specialised toolkit for text-heavy problems.',
    icon: 'type',
    estimatedWeeks: 4,
    color: '#ef4444',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'String Fundamentals',
        description: 'Immutability, builders, two-pointer and frequency techniques on text.',
        difficulty: 'Easy',
        estimatedHours: 4,
        estimatedProblems: 10,
      },
      {
        title: 'KMP & Z-Algorithm',
        description: 'Linear-time pattern matching via prefix functions.',
        difficulty: 'Hard',
        estimatedHours: 6,
        estimatedProblems: 9,
      },
      {
        title: 'String Hashing',
        description: 'Polynomial rolling hashes for O(1) substring comparison.',
        difficulty: 'Hard',
        estimatedHours: 5,
        estimatedProblems: 8,
      },
      {
        title: 'Tries & Aho-Corasick',
        description: 'Multi-pattern matching over a trie with failure links.',
        difficulty: 'Expert',
        estimatedHours: 6,
        estimatedProblems: 6,
      },
      {
        title: 'Suffix Structures',
        description: 'Suffix arrays and automata for advanced string queries.',
        difficulty: 'Expert',
        estimatedHours: 8,
        estimatedProblems: 7,
      },
    ],
  },
  {
    title: 'Mathematics',
    order: 9,
    description:
      'Number theory, combinatorics and modular arithmetic — the mathematical backbone of contest problems.',
    icon: 'sigma',
    estimatedWeeks: 4,
    color: '#a855f7',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'Number Theory',
        description: 'GCD/LCM, primes, sieves and factorisation.',
        difficulty: 'Medium',
        estimatedHours: 6,
        estimatedProblems: 14,
      },
      {
        title: 'Modular Arithmetic',
        description: 'Modular inverse, fast exponentiation and modular combinatorics.',
        difficulty: 'Hard',
        estimatedHours: 5,
        estimatedProblems: 11,
      },
      {
        title: 'Combinatorics',
        description: 'Counting, binomial coefficients and inclusion-exclusion.',
        difficulty: 'Hard',
        estimatedHours: 6,
        estimatedProblems: 12,
      },
      {
        title: 'Probability & Expectation',
        description: 'Expected value, linearity of expectation and randomised reasoning.',
        difficulty: 'Hard',
        estimatedHours: 5,
        estimatedProblems: 8,
      },
      {
        title: 'Matrix Exponentiation',
        description: 'Fast linear recurrences via matrix power in O(k³ log n).',
        difficulty: 'Expert',
        estimatedHours: 5,
        estimatedProblems: 6,
      },
    ],
  },
  {
    title: 'Algorithm Engineering & HFT Thinking',
    order: 10,
    description:
      'Where competitive skill meets the real world: constant-factor optimisation, cache-aware code and low-latency systems thinking.',
    icon: 'cpu',
    estimatedWeeks: 5,
    color: '#f97316',
    isUnlocked: false,
    isCompleted: false,
    topics: [
      {
        title: 'Constant-Factor Optimisation',
        description: 'Bit tricks, branch reduction and micro-optimisations that matter at scale.',
        difficulty: 'Expert',
        estimatedHours: 6,
        estimatedProblems: 8,
      },
      {
        title: 'Cache-Aware Algorithms',
        description: 'Memory hierarchy, locality of reference and data-oriented layouts.',
        difficulty: 'Expert',
        estimatedHours: 6,
        estimatedProblems: 6,
      },
      {
        title: 'Low-Latency Data Structures',
        description: 'Lock-free queues, ring buffers and allocation-free hot paths.',
        difficulty: 'Expert',
        estimatedHours: 7,
        estimatedProblems: 6,
      },
      {
        title: 'Order Book & Market Data',
        description: 'Modelling an order book and processing high-throughput event streams.',
        difficulty: 'Expert',
        estimatedHours: 8,
        estimatedProblems: 5,
      },
      {
        title: 'Benchmarking & Profiling',
        description: 'Measuring latency percentiles, avoiding micro-benchmark traps and reading a profiler.',
        difficulty: 'Hard',
        estimatedHours: 5,
        estimatedProblems: 4,
      },
    ],
  },
];
