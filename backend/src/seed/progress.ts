import type { MasteryMetrics } from '../types/domain.js';

/**
 * Demo learning progress — seeded so the app "feels alive" on first run.
 *
 * Story: Phase 0 fully mastered, Phase 1 in progress with the learner currently
 * on **Sliding Window** (~67% mastery, assessment still pending). Keyed by exact
 * topic title; the seed computes mastery/status/stage via the MasteryService so
 * nothing is hard-coded twice.
 */
export interface DemoTopicProgress {
  title: string;
  metrics: MasteryMetrics;
}

const mastered: MasteryMetrics = {
  recognition: 100,
  implementation: 100,
  standard: 95,
  variant: 95,
  mixed: 95,
  contest: 90,
  assessment: 95,
  confidence: 92,
};

const completed = (variant = 80, mixed = 75, contest = 72): MasteryMetrics => ({
  recognition: 92,
  implementation: 88,
  standard: 82,
  variant,
  mixed,
  contest,
  assessment: 85,
  confidence: 82,
});

export const DEMO_CURRENT_TITLE = 'Sliding Window';

export const DEMO_PROGRESS: DemoTopicProgress[] = [
  // Phase 0 — Competitive Programming Setup: fully mastered.
  { title: 'Environment & Toolchain', metrics: mastered },
  { title: 'Fast Input / Output', metrics: mastered },
  { title: 'Time & Space Complexity', metrics: mastered },
  { title: 'Problem-Solving Workflow', metrics: mastered },

  // Phase 1 — Arrays & Linear Patterns: 4 completed, Sliding Window in progress.
  { title: 'Array Fundamentals', metrics: mastered },
  { title: 'Prefix Sum', metrics: completed(80, 74, 70) },
  { title: 'Difference Array', metrics: completed(78, 72, 70) },
  { title: 'Two Pointers', metrics: completed(82, 78, 74) },
  {
    title: DEMO_CURRENT_TITLE,
    metrics: {
      recognition: 90,
      implementation: 82,
      standard: 72,
      variant: 55,
      mixed: 40,
      contest: 30,
      assessment: 60, // < pass threshold → assessment pending, topic still In Progress
      confidence: 70,
    },
  },
];
