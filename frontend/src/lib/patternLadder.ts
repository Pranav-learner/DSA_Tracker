/**
 * The Pattern Ladder — a fixed 6-stage progression every topic follows.
 * In Sprint 2 the locked/completed/progress state is a **placeholder**; real
 * unlock + mastery logic arrives in Sprint 3. The structure lives here so the
 * component and Redux slice share one source of truth.
 */
export interface PatternStage {
  id: string;
  title: string;
  description: string;
}

export const PATTERN_LADDER: PatternStage[] = [
  {
    id: 'recognition',
    title: 'Recognition',
    description: 'Learn to spot the pattern from a problem statement using its recognition keywords.',
  },
  {
    id: 'implementation',
    title: 'Implementation',
    description: 'Internalise the template and implement it cleanly from memory.',
  },
  {
    id: 'standard-problems',
    title: 'Standard Problems',
    description: 'Solve canonical problems that map directly onto the pattern.',
  },
  {
    id: 'variant-problems',
    title: 'Variant Problems',
    description: 'Handle twists and variations that bend the base template.',
  },
  {
    id: 'mixed-problems',
    title: 'Mixed Problems',
    description: 'Recognise the pattern when it is disguised or combined with others.',
  },
  {
    id: 'contest-problems',
    title: 'Contest Problems',
    description: 'Apply the pattern under time pressure on contest-grade problems.',
  },
];

export type LadderStageState = 'locked' | 'available' | 'completed';

/**
 * Placeholder state for a stage. Sprint 3 replaces this with real per-user
 * progress; today only the first stage is "available", the rest are "locked".
 */
export function placeholderStageState(index: number): LadderStageState {
  return index === 0 ? 'available' : 'locked';
}
