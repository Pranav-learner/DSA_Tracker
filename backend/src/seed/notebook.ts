/**
 * Demo Pattern Notebook — seeded so the Knowledge Engine "feels alive" on first
 * run. Entries are keyed by problem title; related problems / related entries are
 * given as titles and resolved to ids during seeding (two-pass).
 *
 * The Prefix Sum → Difference Array → Fenwick Tree → Segment Tree chain is wired
 * via `relatedEntryProblemTitles` to demonstrate the knowledge graph relationships
 * a later module will visualise.
 */
export interface DemoNotebook {
  problemTitle: string;
  confidence: number;
  recognitionKeywords: string[];
  observation: string;
  coreAlgorithm: string;
  timeComplexity: string;
  spaceComplexity: string;
  alternativeSolutions: { title: string; detail: string }[];
  commonMistakes: string[];
  lessonsLearned: string;
  personalNotes?: string;
  relatedProblemTitles?: string[];
  relatedEntryProblemTitles?: string[];
  /** Number of past review timestamps to back-date. */
  revisions?: number;
}

export const DEMO_NOTEBOOK: DemoNotebook[] = [
  {
    problemTitle: 'Two Sum',
    confidence: 90,
    recognitionKeywords: ['pair sums to target', 'return indices', 'unsorted array'],
    observation:
      'Any "find two numbers that sum to K" over an unsorted array is a one-pass hash lookup: for each x, check if K-x was already seen.',
    coreAlgorithm:
      'Iterate once, keeping a map value→index. For each x, if (target-x) is in the map, return the pair; otherwise store x.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    alternativeSolutions: [
      { title: 'Sort + two pointers', detail: 'O(n log n), but loses original indices — only use when indices are not required.' },
      { title: 'Brute force', detail: 'O(n²) double loop — fine for tiny n, TLEs otherwise.' },
    ],
    commonMistakes: ['Storing the value before checking the complement (matches an element with itself)'],
    lessonsLearned: 'Hashing turns an O(n²) pair search into O(n). Recognise "complement" phrasing instantly.',
    revisions: 2,
  },
  {
    problemTitle: 'Range Sum Query - Immutable',
    confidence: 85,
    recognitionKeywords: ['many range-sum queries', 'immutable array', 'cumulative'],
    observation:
      'Repeated range-sum queries over a static array → precompute prefix sums once, then each query is O(1) via prefix[r+1]-prefix[l].',
    coreAlgorithm: 'Build prefix[0]=0, prefix[i+1]=prefix[i]+a[i]. Answer sum(l..r)=prefix[r+1]-prefix[l].',
    timeComplexity: 'O(n) build, O(1) per query',
    spaceComplexity: 'O(n)',
    alternativeSolutions: [
      { title: 'Fenwick tree', detail: 'Needed only if the array is mutable between queries.' },
    ],
    commonMistakes: ['Off-by-one on the prefix offset (mixing prefix[r] vs prefix[r+1])'],
    lessonsLearned: 'Prefix sums are the base of a whole family: difference arrays, 2D sums, subarray-sum-hashing.',
    relatedProblemTitles: ['Subarray Sum Equals K'],
    relatedEntryProblemTitles: ['Corporate Flight Bookings'],
    revisions: 3,
  },
  {
    problemTitle: 'Corporate Flight Bookings',
    confidence: 78,
    recognitionKeywords: ['batch range updates', 'only final array needed', 'increment interval'],
    observation:
      'Many +v updates on ranges, queried only at the end → difference array: record deltas at the boundaries, prefix-sum once to materialise.',
    coreAlgorithm: 'For +v on [l,r]: diff[l]+=v, diff[r+1]-=v. A single prefix sum over diff yields the final array.',
    timeComplexity: 'O(n + q)',
    spaceComplexity: 'O(n)',
    alternativeSolutions: [
      { title: 'Segment tree with lazy propagation', detail: 'Only when updates and queries interleave online.' },
    ],
    commonMistakes: ['Forgetting the -v at r+1', 'Index out of bounds when r+1 == n'],
    lessonsLearned: 'Difference array IS the inverse of prefix sum — the two are a matched pair.',
    relatedEntryProblemTitles: ['Range Sum Query - Immutable', 'Fenwick Tree (BIT): Core Drill'],
    revisions: 1,
  },
  {
    problemTitle: 'Fenwick Tree (BIT): Core Drill',
    confidence: 62,
    recognitionKeywords: ['point update', 'prefix query', 'mutable array', 'inversions'],
    observation:
      'When the array changes between prefix queries, a Fenwick (Binary Indexed) tree gives O(log n) point-update and prefix-query.',
    coreAlgorithm: 'update(i,v): i += i&-i climbing; query(i): i -= i&-i descending, summing tree nodes.',
    timeComplexity: 'O(log n) per op',
    spaceComplexity: 'O(n)',
    alternativeSolutions: [
      { title: 'Segment tree', detail: 'More general (any associative merge, range updates) at ~2× constant factor.' },
    ],
    commonMistakes: ['1-indexing confusion', 'Using it when a plain prefix sum (immutable) suffices'],
    lessonsLearned: 'Fenwick is the mutable upgrade of a prefix sum; reach for it only when updates interleave.',
    relatedEntryProblemTitles: ['Corporate Flight Bookings', 'Segment Tree: Core Drill'],
    revisions: 1,
  },
  {
    problemTitle: 'Segment Tree: Core Drill',
    confidence: 55,
    recognitionKeywords: ['range query + range/point update', 'associative merge', 'RMQ'],
    observation:
      'The general range-query structure: any associative merge (sum/min/max/gcd) over ranges with updates, in O(log n).',
    coreAlgorithm: 'Build a binary tree over segments; query/update recurse into overlapping children and merge.',
    timeComplexity: 'O(n) build, O(log n) per op',
    spaceComplexity: 'O(n)',
    alternativeSolutions: [
      { title: 'Fenwick tree', detail: 'Smaller/faster for invertible ops (sum) but less general.' },
      { title: 'Sparse table', detail: 'O(1) idempotent range queries, but immutable only.' },
    ],
    commonMistakes: ['Lazy propagation not pushed down before recursing'],
    lessonsLearned: 'Segment tree generalises Fenwick — the top of the range-query ladder.',
    relatedEntryProblemTitles: ['Fenwick Tree (BIT): Core Drill'],
    revisions: 0,
  },
  {
    problemTitle: 'Longest Substring Without Repeating Characters',
    confidence: 70,
    recognitionKeywords: ['longest substring', 'no repeats', 'contiguous', 'variable window'],
    observation:
      'Longest contiguous substring under a constraint → variable-size sliding window; grow right, shrink left when the constraint breaks.',
    coreAlgorithm: 'Expand right, track last-seen index per char; on a repeat, jump left past the previous occurrence; track max length.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(k) charset',
    alternativeSolutions: [
      { title: 'Brute force all substrings', detail: 'O(n²)/O(n³) — only for tiny inputs.' },
    ],
    commonMistakes: ['Moving left one step at a time instead of jumping past the duplicate'],
    lessonsLearned: 'Variable windows shrink only when invalid — the invariant must be monotonic.',
    relatedProblemTitles: ['Container With Most Water'],
    revisions: 1,
  },
];
