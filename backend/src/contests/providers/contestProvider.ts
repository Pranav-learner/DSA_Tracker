import type { ContestPlatform } from '../../types/domain.js';

/**
 * ContestProvider — the multi-platform abstraction. Each platform implements
 * this interface, so the rest of the engine never special-cases a platform.
 * Sprint 1 uses manual data entry; the interface is deliberately shaped so a
 * future API integration (fetch contests, live ratings) slots in WITHOUT any
 * schema change — the provider gains fetch methods, callers stay the same.
 */
export interface ContestProviderMeta {
  platform: ContestPlatform;
  label: string;
  baseUrl: string;
  /** Whether the platform assigns a rating (all four currently do). */
  supportsRating: boolean;
  /** Whether the platform has meaningful divisions/series. */
  supportsDivisions: boolean;
  /** Known divisions/series for the data-driven filter + entry form. */
  divisions: string[];
}

export interface ContestProvider extends ContestProviderMeta {
  /** Build the canonical contest URL for a given platform contest id. */
  contestUrl(contestId: string): string;
}

function makeProvider(meta: ContestProviderMeta, urlPattern: (id: string) => string): ContestProvider {
  return { ...meta, contestUrl: (contestId: string) => urlPattern(String(contestId).trim()) };
}

export const codeforcesProvider = makeProvider(
  {
    platform: 'Codeforces',
    label: 'Codeforces',
    baseUrl: 'https://codeforces.com',
    supportsRating: true,
    supportsDivisions: true,
    divisions: ['Div. 1', 'Div. 2', 'Div. 3', 'Div. 4', 'Educational', 'Global'],
  },
  (id) => `https://codeforces.com/contest/${id}`,
);

export const leetcodeProvider = makeProvider(
  {
    platform: 'LeetCode',
    label: 'LeetCode',
    baseUrl: 'https://leetcode.com',
    supportsRating: true,
    supportsDivisions: false,
    divisions: ['Weekly', 'Biweekly'],
  },
  (id) => `https://leetcode.com/contest/${id}`,
);

export const atcoderProvider = makeProvider(
  {
    platform: 'AtCoder',
    label: 'AtCoder',
    baseUrl: 'https://atcoder.jp',
    supportsRating: true,
    supportsDivisions: true,
    divisions: ['ABC', 'ARC', 'AGC', 'AHC'],
  },
  (id) => `https://atcoder.jp/contests/${id}`,
);

export const codechefProvider = makeProvider(
  {
    platform: 'CodeChef',
    label: 'CodeChef',
    baseUrl: 'https://www.codechef.com',
    supportsRating: true,
    supportsDivisions: true,
    divisions: ['Div 1', 'Div 2', 'Div 3', 'Div 4', 'Starters'],
  },
  (id) => `https://www.codechef.com/${id}`,
);

const REGISTRY: Record<ContestPlatform, ContestProvider> = {
  Codeforces: codeforcesProvider,
  LeetCode: leetcodeProvider,
  AtCoder: atcoderProvider,
  CodeChef: codechefProvider,
};

/** Resolve the provider for a platform (defaults to Codeforces defensively). */
export function getContestProvider(platform: ContestPlatform): ContestProvider {
  return REGISTRY[platform] ?? codeforcesProvider;
}

/** All provider metadata — powers the data-driven platform/division pickers. */
export function listContestProviders(): ContestProviderMeta[] {
  return Object.values(REGISTRY).map(({ contestUrl, ...meta }) => {
    void contestUrl;
    return meta;
  });
}
