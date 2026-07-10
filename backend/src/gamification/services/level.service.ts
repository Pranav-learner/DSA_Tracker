import { LEVEL_CONFIG, LEVEL_TIERS, type LevelConfig } from '../../config/gamification.js';
import type { LevelFormulaName } from '../../types/domain.js';

/**
 * A fully-resolved view of where a given lifetime XP total sits in the level
 * curve. All absolute-vs-relative XP semantics match UserProgression's fields.
 */
export interface LevelState {
  level: number;
  /** XP earned within the current level (progress numerator). */
  currentXP: number;
  /** Absolute XP threshold at which the current level began (floor). */
  currentLevelXP: number;
  /** XP span of the current level (progress denominator). */
  nextLevelXP: number;
  /** XP still needed to reach the next level. */
  xpRemaining: number;
  /** 0–1 progress through the current level. */
  levelProgress: number;
  /** Cosmetic rank tier name for this level. */
  tier: string;
  /** True once the ceiling (`maxLevel`) is reached — curve caps here. */
  isMaxLevel: boolean;
}

/**
 * A level-progression curve: given a level `L`, the XP cost to advance from `L`
 * to `L+1`. Cumulative thresholds are derived by summing costs — never stored —
 * so retuning the curve reprices every user consistently.
 */
export type LevelFormula = (level: number, config: LevelConfig) => number;

/**
 * Registry of named formulas (mirrors the revision/decay strategy registries).
 * New curves plug in here with no schema or engine change.
 */
export const LEVEL_FORMULAS: Record<LevelFormulaName, LevelFormula> = {
  /** cost(L) = baseXP · L^exponent — costs grow super-linearly (classic RPG). */
  exponential: (level, config) => Math.round(config.baseXP * Math.pow(level, config.exponent)),
  /** cost(L) = baseXP · L — costs grow linearly. */
  linear: (level, config) => Math.round(config.baseXP * level),
};

function tierFor(level: number): string {
  let name = LEVEL_TIERS[0]?.name ?? 'Novice';
  for (const tier of LEVEL_TIERS) {
    if (level >= tier.minLevel) name = tier.name;
  }
  return name;
}

/**
 * LevelService — turns cumulative XP into a level and its progress. It owns the
 * progression *math only*; it never reads or writes the database. Thresholds are
 * always derived from the configured formula, so nothing is hardcoded.
 */
export const levelService = {
  config(): LevelConfig {
    return LEVEL_CONFIG;
  },

  formula(): LevelFormula {
    return LEVEL_FORMULAS[LEVEL_CONFIG.formula];
  },

  /** XP cost to go from `level` → `level + 1`. */
  costForLevel(level: number): number {
    return this.formula()(level, LEVEL_CONFIG);
  },

  /** Cumulative XP required to *reach* `level` (level 1 starts at 0). */
  thresholdForLevel(level: number): number {
    let total = 0;
    for (let l = 1; l < level; l += 1) total += this.costForLevel(l);
    return total;
  },

  /** The highest level whose threshold is ≤ `totalXP`. */
  levelForXP(totalXP: number): number {
    const { maxLevel } = LEVEL_CONFIG;
    let level = 1;
    let threshold = 0;
    while (level < maxLevel) {
      const next = threshold + this.costForLevel(level);
      if (next > totalXP) break;
      threshold = next;
      level += 1;
    }
    return level;
  },

  /** Full resolved level state for a lifetime XP total. */
  compute(totalXP: number): LevelState {
    const { maxLevel } = LEVEL_CONFIG;
    const level = this.levelForXP(totalXP);
    const isMaxLevel = level >= maxLevel;

    const currentLevelXP = this.thresholdForLevel(level);
    const nextLevelXP = this.costForLevel(level);
    const currentXP = totalXP - currentLevelXP;
    const xpRemaining = isMaxLevel ? 0 : Math.max(0, nextLevelXP - currentXP);
    const levelProgress = isMaxLevel ? 1 : nextLevelXP === 0 ? 0 : Math.min(1, currentXP / nextLevelXP);

    return {
      level,
      currentXP,
      currentLevelXP,
      nextLevelXP,
      xpRemaining,
      levelProgress,
      tier: tierFor(level),
      isMaxLevel,
    };
  },

  tierFor,

  /**
   * The published level ladder — used by GET /levels. Each entry describes one
   * level's cost, cumulative threshold and rank tier.
   */
  ladder(upTo = LEVEL_CONFIG.maxLevel): {
    level: number;
    xpForLevel: number;
    totalXpToReach: number;
    tier: string;
  }[] {
    const rows: { level: number; xpForLevel: number; totalXpToReach: number; tier: string }[] = [];
    let cumulative = 0;
    for (let level = 1; level <= upTo; level += 1) {
      const xpForLevel = this.costForLevel(level);
      rows.push({ level, xpForLevel, totalXpToReach: cumulative, tier: tierFor(level) });
      cumulative += xpForLevel;
    }
    return rows;
  },
};
