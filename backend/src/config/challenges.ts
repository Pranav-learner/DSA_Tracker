import type { ActivityType, ChallengeType } from '../types/domain.js';

/**
 * Challenge templates (Module 6 · Sprint 2). The ChallengeService instantiates
 * live per-user challenges from these templates and resets recurring ones when
 * they expire. Targets, rewards and the advancing activity are all data here —
 * the engine never hardcodes a challenge.
 */
export interface ChallengeTemplate {
  key: string;
  title: string;
  description: string;
  challengeType: ChallengeType;
  targetValue: number;
  rewardXP: number;
  /** Optional badge granted on completion. */
  rewardBadge?: string;
  /**
   * The activity type whose occurrences advance this challenge (matched against
   * the ActivityEvent by the ProgressionRulesEngine).
   */
  activityType: ActivityType;
}

/**
 * The active template set per cadence. Daily/Weekly/Monthly are generated as a
 * bundle when the previous set expires; Phase challenges are generated against
 * the learner's current phase. Custom challenges are created ad hoc (seam left
 * open — none shipped this sprint).
 */
export const CHALLENGE_TEMPLATES: Record<Exclude<ChallengeType, 'Custom'>, ChallengeTemplate[]> = {
  Daily: [
    { key: 'daily-solve-5', title: 'Daily Grind', description: 'Solve 5 problems today.', challengeType: 'Daily', targetValue: 5, rewardXP: 50, activityType: 'problem-solved' },
    { key: 'daily-revise-2', title: 'Stay Sharp', description: 'Complete 2 revisions today.', challengeType: 'Daily', targetValue: 2, rewardXP: 30, activityType: 'revision-completed' },
    { key: 'daily-notebook-1', title: 'Document It', description: 'Create 1 knowledge entry today.', challengeType: 'Daily', targetValue: 1, rewardXP: 25, activityType: 'notebook-created' },
  ],
  Weekly: [
    { key: 'weekly-solve-20', title: 'Weekly Warrior', description: 'Solve 20 problems this week.', challengeType: 'Weekly', targetValue: 20, rewardXP: 200, activityType: 'problem-solved' },
    { key: 'weekly-revise-5', title: 'Retention Routine', description: 'Complete 5 revisions this week.', challengeType: 'Weekly', targetValue: 5, rewardXP: 100, activityType: 'revision-completed' },
    { key: 'weekly-contest-1', title: 'Compete', description: 'Finish 1 contest this week.', challengeType: 'Weekly', targetValue: 1, rewardXP: 150, rewardBadge: 'contest-veteran', activityType: 'contest-finished' },
  ],
  Monthly: [
    { key: 'monthly-solve-60', title: 'Monthly Marathon', description: 'Solve 60 problems this month.', challengeType: 'Monthly', targetValue: 60, rewardXP: 600, activityType: 'problem-solved' },
    { key: 'monthly-notebook-8', title: 'Knowledge Base', description: 'Create 8 knowledge entries this month.', challengeType: 'Monthly', targetValue: 8, rewardXP: 300, rewardBadge: 'knowledge-builder', activityType: 'notebook-created' },
  ],
  Phase: [
    { key: 'phase-topic-1', title: 'Complete Current Topic', description: 'Complete a topic in your current phase.', challengeType: 'Phase', targetValue: 1, rewardXP: 100, activityType: 'topic-completed' },
  ],
};

/** Every non-custom template, flattened (used by the seed + tests). */
export const ALL_CHALLENGE_TEMPLATES: ChallengeTemplate[] = Object.values(CHALLENGE_TEMPLATES).flat();
