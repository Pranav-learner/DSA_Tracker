import { slugify } from '../utils/slugify.js';
import {
  DIFFICULTIES,
  type ConceptExample,
  type Difficulty,
  type RepresentativeProblem,
} from '../types/domain.js';

/**
 * Sprint 2 — topic study content.
 *
 * `AUTHORED` holds hand-written content for flagship topics (relations are given
 * as topic *titles* for readability). `buildTopicContent()` merges authored
 * content over sensible derived defaults so **every** topic ends up with a
 * complete, non-empty workspace, then converts relation titles → slugs.
 */

export interface AuthoredContent {
  coreIdea: string;
  whenToUse: string;
  whenNotToUse: string;
  timeComplexity: string;
  spaceComplexity: string;
  advantages: string[];
  limitations: string[];
  applications: string[];
  examples: ConceptExample[];
  recognitionKeywords: string[];
  /** Given as topic titles; resolved to slugs by buildTopicContent. */
  prerequisites: string[];
  relatedTopics: string[];
  representativeProblems: RepresentativeProblem[];
}

export interface ResolvedContent extends Omit<AuthoredContent, 'prerequisites' | 'relatedTopics'> {
  prerequisites: string[]; // slugs
  relatedTopics: string[]; // slugs
}

export interface BuildContext {
  title: string;
  description: string;
  difficulty: Difficulty;
  prevTitle?: string;
  nextTitle?: string;
  siblingTitles: string[];
}

const ORDER: Difficulty[] = [...DIFFICULTIES];
const shift = (d: Difficulty, by: number): Difficulty =>
  ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(d) + by))];

const STOP = new Set(['and', 'the', 'of', 'to', 'on', 'in', 'a', 'an', 'for', 'with', 'core']);

/** Derived, tailored-but-generic content used when nothing is authored. */
function derive(ctx: BuildContext): AuthoredContent {
  const { title, description, difficulty, prevTitle, siblingTitles } = ctx;
  const words = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w));

  return {
    coreIdea: `${description} At its core, ${title} is about recognising the signature of the problem and applying a well-known template cleanly under contest constraints.`,
    whenToUse: `Reach for ${title} when a problem's structure matches its signature — the recognition keywords below are the tell-tale signs.`,
    whenNotToUse: `Avoid forcing ${title} when a simpler scan or a different data structure models the problem more naturally, or when its preconditions don't hold.`,
    timeComplexity: 'Depends on the variant; the core pattern is designed to beat the brute-force baseline.',
    spaceComplexity: 'Typically O(1)–O(n) auxiliary space depending on the bookkeeping required.',
    advantages: [
      'Turns a brute-force idea into an efficient, reusable approach',
      'Applies across many problem variants once recognised',
      'Has a clear, well-known implementation template',
    ],
    limitations: [
      'Requires spotting the pattern from the statement',
      'Edge cases need careful handling',
      'Not applicable when the underlying structure differs',
    ],
    applications: ['Competitive programming contests', 'Technical interviews', 'Engineering variants of the same problem'],
    examples: [
      {
        title: `A first ${title} problem`,
        detail: `A representative problem processes the input while maintaining the invariant that is central to ${title}, avoiding repeated recomputation.`,
      },
    ],
    recognitionKeywords: [...new Set([...words, 'pattern', 'constraints', 'optimization'])],
    prerequisites: prevTitle ? [prevTitle] : [],
    relatedTopics: siblingTitles.filter((t) => t !== title && t !== prevTitle).slice(0, 3),
    representativeProblems: [
      {
        name: `${title}: Warmup`,
        platform: 'LeetCode',
        difficulty: shift(difficulty, -1),
        pattern: title,
        estimatedMinutes: 20,
      },
      {
        name: `${title}: Core Drill`,
        platform: 'Codeforces',
        difficulty,
        pattern: title,
        estimatedMinutes: 35,
      },
      {
        name: `${title}: Challenge`,
        platform: 'CSES',
        difficulty: shift(difficulty, 1),
        pattern: title,
        estimatedMinutes: 50,
      },
    ],
  };
}

/**
 * Hand-authored content for flagship topics along the primary learning path.
 * Keyed by exact topic title (matches src/seed/data.ts).
 */
export const AUTHORED: Record<string, AuthoredContent> = {
  'Array Fundamentals': {
    coreIdea:
      'Arrays store elements contiguously in memory, giving O(1) random access by index. Mastering traversal, in-place updates and index arithmetic is the foundation every later pattern builds on.',
    whenToUse: 'Whenever data is naturally sequential and you need fast indexed access or in-place transformation.',
    whenNotToUse: 'When you need frequent insertions/deletions in the middle (a linked structure fits better) or key-based lookup (use a hash map).',
    timeComplexity: 'Access O(1); traversal O(n); insertion/deletion in the middle O(n).',
    spaceComplexity: 'O(1) extra for in-place work; O(n) if a copy is built.',
    advantages: ['Constant-time indexing', 'Cache-friendly contiguous layout', 'Simple, predictable memory model'],
    limitations: ['Fixed size in many languages', 'Costly mid-array insert/delete', 'No built-in key lookup'],
    applications: ['Prefix/suffix computations', 'Two-pointer and window techniques', 'Matrix and grid representations'],
    examples: [
      { title: 'In-place reversal', detail: 'Swap the i-th and (n-1-i)-th elements moving inward to reverse without extra space.' },
      { title: 'Rotate by k', detail: 'Reverse the whole array, then reverse the two parts to rotate in O(n) time and O(1) space.' },
    ],
    recognitionKeywords: ['array', 'index', 'in-place', 'rotate', 'traverse', 'contiguous', 'swap'],
    prerequisites: [],
    relatedTopics: ['Prefix Sum', 'Two Pointers', 'Sliding Window'],
    representativeProblems: [
      { name: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Hashing / Scan', estimatedMinutes: 15, url: 'https://leetcode.com/problems/two-sum/' },
      { name: 'Rotate Array', platform: 'LeetCode', difficulty: 'Medium', pattern: 'In-place Reversal', estimatedMinutes: 25, url: 'https://leetcode.com/problems/rotate-array/' },
      { name: 'Product of Array Except Self', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Prefix/Suffix', estimatedMinutes: 30, url: 'https://leetcode.com/problems/product-of-array-except-self/' },
    ],
  },

  'Prefix Sum': {
    coreIdea:
      'Precompute cumulative sums so any range sum is answered in O(1) as prefix[r] - prefix[l-1]. It converts repeated range queries from O(n) each into constant time after an O(n) build.',
    whenToUse: 'When you must answer many range-sum (or range-count) queries over a static array, or reduce a subarray-sum search to a hash lookup.',
    whenNotToUse: 'When the array changes between queries (use a Fenwick/segment tree) or when ranges are non-contiguous.',
    timeComplexity: 'O(n) preprocessing, O(1) per range query.',
    spaceComplexity: 'O(n) for the prefix array (O(n·m) for 2D grids).',
    advantages: ['O(1) range queries after preprocessing', 'Extends cleanly to 2D', 'Pairs with hashing for subarray-sum problems'],
    limitations: ['Assumes an immutable array', 'Extra O(n) memory', 'Off-by-one indexing is error-prone'],
    applications: ['Range-sum queries', 'Subarray sum equals K', 'Equilibrium / pivot index problems'],
    examples: [
      { title: 'Range sum', detail: 'With prefix[0]=0, the sum of a[l..r] is prefix[r+1]-prefix[l].' },
      { title: 'Subarray sum = K', detail: 'Store prefix counts in a hash map; for each prefix p, add the count of p-K seen so far.' },
    ],
    recognitionKeywords: ['range sum', 'cumulative', 'subarray sum', 'prefix', 'query', 'equals k'],
    prerequisites: ['Array Fundamentals'],
    relatedTopics: ['Difference Array', 'Sliding Window', 'Two Pointers'],
    representativeProblems: [
      { name: 'Range Sum Query - Immutable', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Prefix Sum', estimatedMinutes: 15, url: 'https://leetcode.com/problems/range-sum-query-immutable/' },
      { name: 'Subarray Sum Equals K', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Prefix + Hashing', estimatedMinutes: 30, url: 'https://leetcode.com/problems/subarray-sum-equals-k/' },
      { name: 'Range Sum Queries', platform: 'CSES', difficulty: 'Easy', pattern: 'Prefix Sum', estimatedMinutes: 20, url: 'https://cses.fi/problemset/task/1646' },
    ],
  },

  'Difference Array': {
    coreIdea:
      'To apply many range updates offline, record only the deltas at range boundaries; a single prefix-sum pass then materialises the final array in O(n).',
    whenToUse: 'When you have a batch of range-increment updates and only need the final array (or its queries) afterwards.',
    whenNotToUse: 'When updates and queries interleave online (use a Fenwick/segment tree with lazy propagation).',
    timeComplexity: 'O(1) per update, O(n) to reconstruct.',
    spaceComplexity: 'O(n) for the difference array.',
    advantages: ['O(1) range updates', 'Trivial to implement', 'Great for offline batch updates'],
    limitations: ['Only the final state is efficient', 'Not suited to interleaved queries', 'Boundary indexing needs care'],
    applications: ['Range increment problems', 'Interval booking / coverage counts', 'Car-pooling capacity checks'],
    examples: [
      { title: 'Range increment', detail: 'For +v on [l, r]: diff[l] += v and diff[r+1] -= v; a prefix sum yields the result.' },
    ],
    recognitionKeywords: ['range update', 'increment', 'interval', 'offline', 'difference', 'booking'],
    prerequisites: ['Prefix Sum'],
    relatedTopics: ['Prefix Sum', 'Array Fundamentals'],
    representativeProblems: [
      { name: 'Corporate Flight Bookings', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Difference Array', estimatedMinutes: 25, url: 'https://leetcode.com/problems/corporate-flight-bookings/' },
      { name: 'Range Update Queries', platform: 'CSES', difficulty: 'Medium', pattern: 'Difference + Prefix', estimatedMinutes: 30, url: 'https://cses.fi/problemset/task/1651' },
      { name: 'Car Pooling', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Difference Array', estimatedMinutes: 25, url: 'https://leetcode.com/problems/car-pooling/' },
    ],
  },

  'Two Pointers': {
    coreIdea:
      'Maintain two indices that move under a rule — from opposite ends or in the same direction — to explore pairs or ranges in O(n) instead of O(n²).',
    whenToUse: 'On sorted arrays for pair-sum problems, or to partition/merge sequences with a monotonic movement rule.',
    whenNotToUse: 'When the movement rule is not monotonic, or when the data lacks the order the technique relies on.',
    timeComplexity: 'O(n) after any required O(n log n) sort.',
    spaceComplexity: 'O(1) auxiliary.',
    advantages: ['Linear scan of a quadratic space', 'Constant extra memory', 'Foundation for the sliding window'],
    limitations: ['Often needs sorted input', 'Movement rule must be monotonic', 'Duplicate handling is subtle'],
    applications: ['Pair/triplet sums', 'Merging sorted arrays', 'Partitioning (Dutch national flag)'],
    examples: [
      { title: 'Pair sum on sorted array', detail: 'Move left/right inward: if the sum is too small advance left, if too big retreat right.' },
    ],
    recognitionKeywords: ['sorted', 'pair', 'two sum', 'opposite ends', 'partition', 'merge', 'triplet'],
    prerequisites: ['Array Fundamentals'],
    relatedTopics: ['Sliding Window', 'Binary Search', 'Prefix Sum'],
    representativeProblems: [
      { name: 'Two Sum II - Input Array Is Sorted', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Opposite-end Pointers', estimatedMinutes: 20, url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/' },
      { name: '3Sum', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Sort + Two Pointers', estimatedMinutes: 35, url: 'https://leetcode.com/problems/3sum/' },
      { name: 'Container With Most Water', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Opposite-end Pointers', estimatedMinutes: 25, url: 'https://leetcode.com/problems/container-with-most-water/' },
    ],
  },

  'Sliding Window': {
    coreIdea:
      'Maintain a moving window over a sequence, expanding and contracting its boundaries so a running summary (sum, count, frequency map) updates in O(1) per step instead of being recomputed.',
    whenToUse: 'When the answer concerns a contiguous subarray or substring and a metric can be updated incrementally as the window slides.',
    whenNotToUse: "When elements aren't contiguous, the metric can't be updated incrementally, or negatives break the monotonic shrink condition.",
    timeComplexity: 'O(n) — each element enters and leaves the window at most once.',
    spaceComplexity: 'O(1) for fixed windows; O(k) when tracking distinct elements.',
    advantages: ['Linear where brute force is O(n²)', 'Constant-time boundary updates', 'Template covers fixed and variable windows'],
    limitations: ['Only contiguous ranges', 'Shrink logic must be monotonic', 'Frequency bookkeeping can get fiddly'],
    applications: ['Longest/shortest subarray with a constraint', 'Substring problems with character counts', 'Streaming / rate-limit windows'],
    examples: [
      { title: 'Longest substring without repeats', detail: 'Grow the window; on a duplicate, shrink from the left until valid, tracking the max length.' },
      { title: 'Fixed window average', detail: 'Add the entering element and subtract the leaving one to keep the window sum in O(1).' },
    ],
    recognitionKeywords: ['contiguous subarray', 'substring', 'fixed window', 'variable window', 'longest', 'shortest', 'at most k', 'maximize', 'minimize'],
    prerequisites: ['Two Pointers'],
    relatedTopics: ['Two Pointers', 'Prefix Sum', "Kadane's Algorithm"],
    representativeProblems: [
      { name: 'Maximum Average Subarray I', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Fixed Window', estimatedMinutes: 20, url: 'https://leetcode.com/problems/maximum-average-subarray-i/' },
      { name: 'Longest Substring Without Repeating Characters', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Variable Window', estimatedMinutes: 35, url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
      { name: 'Minimum Window Substring', platform: 'LeetCode', difficulty: 'Hard', pattern: 'Variable Window', estimatedMinutes: 50, url: 'https://leetcode.com/problems/minimum-window-substring/' },
    ],
  },

  "Kadane's Algorithm": {
    coreIdea:
      'Scan once, keeping the best subarray sum ending at the current index; the global answer is the max of these. It is the canonical linear DP on a 1D array.',
    whenToUse: 'For maximum (or minimum) contiguous subarray sum and its close variants.',
    whenNotToUse: 'When the subarray must satisfy extra constraints that break the simple running-max recurrence, or when elements are non-contiguous.',
    timeComplexity: 'O(n) single pass.',
    spaceComplexity: 'O(1).',
    advantages: ['Single linear pass', 'Constant memory', 'Gateway to dynamic programming intuition'],
    limitations: ['Contiguous ranges only', 'Careful with all-negative inputs', 'Variants need recurrence tweaks'],
    applications: ['Maximum subarray sum', 'Best time to buy/sell (one transaction)', 'Maximum sum circular subarray'],
    examples: [
      { title: 'Running maximum', detail: 'best = max(x, best + x) at each element; answer = max over all best values.' },
    ],
    recognitionKeywords: ['maximum subarray', 'contiguous', 'largest sum', 'running max', 'dp', 'best ending here'],
    prerequisites: ['Array Fundamentals'],
    relatedTopics: ['Sliding Window', 'Prefix Sum', 'DP Foundations'],
    representativeProblems: [
      { name: 'Maximum Subarray', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Kadane', estimatedMinutes: 20, url: 'https://leetcode.com/problems/maximum-subarray/' },
      { name: 'Maximum Sum Circular Subarray', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Kadane Variant', estimatedMinutes: 30, url: 'https://leetcode.com/problems/maximum-sum-circular-subarray/' },
      { name: 'Best Time to Buy and Sell Stock', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Kadane-style', estimatedMinutes: 20, url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
    ],
  },

  'Binary Search on Answer': {
    coreIdea:
      'When the answer space is monotonic (a predicate flips from false to true at some threshold), binary-search the answer itself and use a feasibility check to decide which half to keep.',
    whenToUse: 'For "minimise the maximum" / "maximise the minimum" problems where you can test feasibility of a candidate answer quickly.',
    whenNotToUse: 'When feasibility is not monotonic in the answer, or a direct formula/greedy is simpler.',
    timeComplexity: 'O(n · log(range)) — a feasibility check per binary-search step.',
    spaceComplexity: 'O(1) beyond the check.',
    advantages: ['Reduces optimisation to a decision problem', 'Handles huge answer ranges', 'Reusable feasibility template'],
    limitations: ['Requires a monotonic predicate', 'Needs a correct, fast check', 'Boundary conditions are subtle'],
    applications: ['Minimum capacity / speed problems', 'Splitting arrays to bound a maximum', 'Aggressive cows / allocation problems'],
    examples: [
      { title: 'Ship within D days', detail: 'Binary-search the capacity; the check simulates loading and counts days needed.' },
    ],
    recognitionKeywords: ['minimize the maximum', 'maximize the minimum', 'feasible', 'threshold', 'monotonic', 'capacity', 'at least', 'at most'],
    prerequisites: ['Binary Search'],
    relatedTopics: ['Binary Search', 'Two Pointers'],
    representativeProblems: [
      { name: 'Koko Eating Bananas', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Binary Search on Answer', estimatedMinutes: 30, url: 'https://leetcode.com/problems/koko-eating-bananas/' },
      { name: 'Capacity To Ship Packages Within D Days', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Binary Search on Answer', estimatedMinutes: 35, url: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/' },
      { name: 'Split Array Largest Sum', platform: 'LeetCode', difficulty: 'Hard', pattern: 'Binary Search on Answer', estimatedMinutes: 45, url: 'https://leetcode.com/problems/split-array-largest-sum/' },
    ],
  },

  'Binary Search': {
    coreIdea:
      'Repeatedly halve a sorted search space by comparing against the middle element, reaching the target (or its insertion point) in O(log n). Getting the boundary conditions right is the whole game.',
    whenToUse: 'On sorted data, or any monotonic predicate, when you need a value or a boundary (lower/upper bound).',
    whenNotToUse: 'On unsorted data without a monotonic property, or on tiny inputs where a linear scan is clearer.',
    timeComplexity: 'O(log n).',
    spaceComplexity: 'O(1) iterative.',
    advantages: ['Logarithmic lookups', 'Foundation for many advanced techniques', 'Constant memory'],
    limitations: ['Requires sorted / monotonic structure', 'Off-by-one and boundary bugs are common', 'Needs random access'],
    applications: ['Lower/upper bound search', 'First/last occurrence', 'Search in rotated arrays'],
    examples: [
      { title: 'Lower bound', detail: 'Keep [lo, hi); move lo past mids that are too small to find the first element ≥ target.' },
    ],
    recognitionKeywords: ['sorted', 'log n', 'lower bound', 'upper bound', 'first occurrence', 'search', 'rotated'],
    prerequisites: ['Sorting Algorithms'],
    relatedTopics: ['Binary Search on Answer', 'Two Pointers'],
    representativeProblems: [
      { name: 'Binary Search', platform: 'LeetCode', difficulty: 'Easy', pattern: 'Classic Binary Search', estimatedMinutes: 15, url: 'https://leetcode.com/problems/binary-search/' },
      { name: 'Find First and Last Position', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Lower/Upper Bound', estimatedMinutes: 30, url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/' },
      { name: 'Search in Rotated Sorted Array', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Modified Binary Search', estimatedMinutes: 35, url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
    ],
  },

  'BFS & DFS': {
    coreIdea:
      'Systematically visit every reachable node exactly once — BFS explores in expanding layers with a queue (shortest hops), DFS dives deep with a stack/recursion (structure & backtracking).',
    whenToUse: 'For traversal, connectivity, cycle detection, shortest path in unweighted graphs (BFS) and component/structure exploration (DFS).',
    whenNotToUse: 'For weighted shortest paths (use Dijkstra) or when the graph is too large to hold in memory.',
    timeComplexity: 'O(V + E).',
    spaceComplexity: 'O(V) for the visited set and frontier.',
    advantages: ['Linear in graph size', 'BFS gives shortest unweighted paths', 'Foundation for most graph algorithms'],
    limitations: ['Ignores edge weights', 'DFS recursion can overflow the stack', 'Needs a visited set to avoid revisiting'],
    applications: ['Connected components', 'Shortest path in grids/mazes', 'Cycle & bipartite detection'],
    examples: [
      { title: 'Grid BFS', detail: 'Enqueue the start, pop layer by layer, push unvisited 4-neighbours; the layer index is the distance.' },
      { title: 'DFS components', detail: 'For each unvisited node, DFS and mark its whole component; count the DFS launches.' },
    ],
    recognitionKeywords: ['graph', 'grid', 'shortest path', 'connected components', 'levels', 'visited', 'traversal', 'maze'],
    prerequisites: ['Graph Representation'],
    relatedTopics: ['Topological Sort', 'Shortest Paths', 'Union-Find (DSU)'],
    representativeProblems: [
      { name: 'Number of Islands', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Grid DFS/BFS', estimatedMinutes: 25, url: 'https://leetcode.com/problems/number-of-islands/' },
      { name: 'Rotting Oranges', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Multi-source BFS', estimatedMinutes: 30, url: 'https://leetcode.com/problems/rotting-oranges/' },
      { name: 'Counting Rooms', platform: 'CSES', difficulty: 'Easy', pattern: 'Flood Fill', estimatedMinutes: 20, url: 'https://cses.fi/problemset/task/1192' },
    ],
  },

  'DP Foundations': {
    coreIdea:
      'Break a problem into overlapping subproblems, define a state and a transition, and cache results (memoisation) or fill a table (tabulation) so each subproblem is solved once.',
    whenToUse: 'When a problem has optimal substructure and overlapping subproblems — counting, optimisation, or feasibility over choices.',
    whenNotToUse: 'When subproblems do not overlap (plain divide & conquer) or a greedy choice is provably optimal.',
    timeComplexity: 'O(number of states × transition cost).',
    spaceComplexity: 'O(number of states), often reducible with rolling arrays.',
    advantages: ['Turns exponential recursion into polynomial time', 'Systematic state/transition framework', 'Reusable across many problem families'],
    limitations: ['Designing the state is the hard part', 'Memory can be large', 'Base cases and order of evaluation are error-prone'],
    applications: ['Counting paths / ways', 'Knapsack and subset problems', 'Edit distance and sequence alignment'],
    examples: [
      { title: 'Climbing stairs', detail: 'ways(n) = ways(n-1) + ways(n-2); memoise or fill bottom-up from the base cases.' },
    ],
    recognitionKeywords: ['overlapping subproblems', 'optimal substructure', 'memoization', 'tabulation', 'state', 'transition', 'count ways', 'minimum cost'],
    prerequisites: ['Recursion Fundamentals'],
    relatedTopics: ['1D DP', 'Knapsack Patterns', 'Grid & 2D DP'],
    representativeProblems: [
      { name: 'Climbing Stairs', platform: 'LeetCode', difficulty: 'Easy', pattern: '1D DP', estimatedMinutes: 15, url: 'https://leetcode.com/problems/climbing-stairs/' },
      { name: 'Coin Change', platform: 'LeetCode', difficulty: 'Medium', pattern: 'Unbounded Knapsack', estimatedMinutes: 35, url: 'https://leetcode.com/problems/coin-change/' },
      { name: 'House Robber', platform: 'LeetCode', difficulty: 'Medium', pattern: '1D DP', estimatedMinutes: 25, url: 'https://leetcode.com/problems/house-robber/' },
    ],
  },
};

/** Build final content for a topic: authored (if any) merged over derived. */
export function buildTopicContent(ctx: BuildContext): ResolvedContent {
  const authored = AUTHORED[ctx.title];
  const base = derive(ctx);
  const merged: AuthoredContent = authored ? { ...base, ...authored } : base;

  return {
    ...merged,
    prerequisites: merged.prerequisites.map(slugify),
    relatedTopics: merged.relatedTopics.map(slugify),
  };
}
