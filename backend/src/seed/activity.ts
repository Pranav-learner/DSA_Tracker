import type { ActivityType, ActivityEntityType } from '../types/domain.js';

/**
 * Demo recent-activity feed — seeded so the dashboard timeline "feels alive" on
 * first run. Mirrors the DEMO_PROGRESS story (Phase 0 mastered, Phase 1 in
 * progress, currently on Sliding Window).
 *
 * `entityTitle` is resolved to a real topic/phase id at seed time; `minutesAgo`
 * back-dates each event so the timeline reads newest-first. This is illustrative
 * data only — real events are appended by the Learning Engine as the user studies.
 */
export interface DemoActivity {
  type: ActivityType;
  entityType: ActivityEntityType;
  /** Exact topic or phase title — resolved to an id during seeding. */
  entityTitle: string;
  title: string;
  description: string;
  minutesAgo: number;
}

const HOUR = 60;
const DAY = 24 * HOUR;

export const DEMO_ACTIVITY: DemoActivity[] = [
  {
    type: 'topic-started',
    entityType: 'topic',
    entityTitle: 'Sliding Window',
    title: 'Started Sliding Window',
    description: 'Began working through the pattern ladder for this topic.',
    minutesAgo: 2 * HOUR,
  },
  {
    type: 'topic-unlocked',
    entityType: 'topic',
    entityTitle: 'Sliding Window',
    title: 'Unlocked Sliding Window',
    description: 'Reached the mastery threshold on Two Pointers.',
    minutesAgo: 3 * HOUR,
  },
  {
    type: 'topic-completed',
    entityType: 'topic',
    entityTitle: 'Two Pointers',
    title: 'Completed Two Pointers',
    description: 'Passed the assessment and reached completion.',
    minutesAgo: 1 * DAY,
  },
  {
    type: 'topic-mastered',
    entityType: 'topic',
    entityTitle: 'Array Fundamentals',
    title: 'Mastered Array Fundamentals',
    description: 'Achieved mastery across every stage of the ladder.',
    minutesAgo: 2 * DAY,
  },
  {
    type: 'topic-completed',
    entityType: 'topic',
    entityTitle: 'Difference Array',
    title: 'Completed Difference Array',
    description: 'Marked this topic as completed.',
    minutesAgo: 3 * DAY,
  },
  {
    type: 'topic-completed',
    entityType: 'topic',
    entityTitle: 'Prefix Sum',
    title: 'Completed Prefix Sum',
    description: 'Marked this topic as completed.',
    minutesAgo: 4 * DAY,
  },
  {
    type: 'phase-completed',
    entityType: 'phase',
    entityTitle: 'Competitive Programming Setup',
    title: 'Completed Phase 0',
    description: 'Finished the Competitive Programming Setup phase.',
    minutesAgo: 6 * DAY,
  },
  {
    type: 'topic-mastered',
    entityType: 'topic',
    entityTitle: 'Problem-Solving Workflow',
    title: 'Mastered Problem-Solving Workflow',
    description: 'Achieved mastery on this topic.',
    minutesAgo: 7 * DAY,
  },
];
