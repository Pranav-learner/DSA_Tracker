import { actionGenerator } from './actionGenerator.js';
import { sectionData, ROUTES } from '../coaches/actions.js';
import type { AIContext, AiIntent } from '../types/ai.types.js';
import type { MentorAction, WorkflowDTO, WorkflowDifficulty, WorkflowKey, WorkflowStepDTO } from './types.js';

/** A step scaffold (the engine fills id/order/action). */
interface StepScaffold {
  title: string;
  description: string;
  module: string;
  /** Action kind resolved from context; falls back to a static route. */
  actionKind: string;
  fallback: { label: string; to: string } | null;
  coachIntent: AiIntent | null;
  estimatedMinutes: number;
  optional?: boolean;
}

interface WorkflowTemplate {
  name: string;
  description: string;
  category: string;
  difficulty: WorkflowDifficulty;
  expectedOutcome: string;
  steps: StepScaffold[];
}

const T: Record<WorkflowKey, WorkflowTemplate> = {
  'study-session': {
    name: 'Focused Study Session',
    description: 'A structured block to make real progress on your current topic.',
    category: 'Learning',
    difficulty: 'moderate',
    expectedOutcome: 'Advance your current topic and shore up one weak pattern.',
    steps: [
      { title: 'Review your plan', description: 'See what the mentor recommends focusing on today.', module: 'analytics', actionKind: 'open-analytics', fallback: { label: 'Open analytics', to: ROUTES.recommendations }, coachIntent: 'study-plan', estimatedMinutes: 5 },
      { title: 'Study your current topic', description: 'Work through the concept and representative problems.', module: 'learning', actionKind: 'open-topic', fallback: { label: 'Continue learning', to: ROUTES.roadmap }, coachIntent: 'study-plan', estimatedMinutes: 30 },
      { title: 'Practice a weak pattern', description: 'Target the area analytics flags as weakest.', module: 'analytics', actionKind: 'practice-pattern', fallback: { label: 'View weaknesses', to: ROUTES.weaknesses }, coachIntent: 'pattern', estimatedMinutes: 20 },
      { title: 'Document what you learned', description: 'Capture the pattern in your notebook while it is fresh.', module: 'knowledge', actionKind: 'open-notebook', fallback: { label: 'Open notebook', to: ROUTES.notebook }, coachIntent: 'notebook', estimatedMinutes: 10, optional: true },
    ],
  },
  'revision-session': {
    name: 'Revision Session',
    description: 'Clear due reviews and reinforce what is slipping.',
    category: 'Revision',
    difficulty: 'light',
    expectedOutcome: 'Clear today’s reviews and protect at-risk knowledge.',
    steps: [
      { title: 'Check due reviews', description: 'See what is due and overdue today.', module: 'revision', actionKind: 'open-revision', fallback: { label: 'Open revision', to: ROUTES.revision }, coachIntent: 'revision', estimatedMinutes: 3 },
      { title: 'Run your review session', description: 'Work the queue overdue-first.', module: 'revision', actionKind: 'open-revision', fallback: { label: 'Start revision', to: ROUTES.revisionSession }, coachIntent: 'revision', estimatedMinutes: 20 },
      { title: 'Reinforce weakest items', description: 'Do a couple of problems on your shakiest pattern.', module: 'analytics', actionKind: 'practice-pattern', fallback: { label: 'View weaknesses', to: ROUTES.weaknesses }, coachIntent: 'pattern', estimatedMinutes: 10, optional: true },
    ],
  },
  'contest-prep': {
    name: 'Contest Preparation',
    description: 'Sharpen speed and patterns before your next rated contest.',
    category: 'Contest',
    difficulty: 'intense',
    expectedOutcome: 'Enter your next contest warmed up on your weak categories.',
    steps: [
      { title: 'Assess readiness', description: 'Review your contest readiness and weak areas.', module: 'contest', actionKind: 'open-contest', fallback: { label: 'Open contests', to: ROUTES.contests }, coachIntent: 'contest', estimatedMinutes: 5 },
      { title: 'Drill weak contest patterns', description: 'Target the categories costing you points.', module: 'analytics', actionKind: 'practice-pattern', fallback: { label: 'View weaknesses', to: ROUTES.weaknesses }, coachIntent: 'contest', estimatedMinutes: 25 },
      { title: 'Do a virtual contest', description: 'Simulate a real round under time pressure.', module: 'contest', actionKind: 'open-contest', fallback: { label: 'Open contests', to: ROUTES.contests }, coachIntent: 'contest', estimatedMinutes: 90 },
      { title: 'Plan upsolves', description: 'Queue the problems you could not solve.', module: 'contest', actionKind: 'open-upsolve', fallback: { label: 'Open upsolve', to: ROUTES.upsolve }, coachIntent: 'contest', estimatedMinutes: 10, optional: true },
    ],
  },
  'contest-review': {
    name: 'Contest Review',
    description: 'Turn your last contest into concrete learning.',
    category: 'Contest',
    difficulty: 'moderate',
    expectedOutcome: 'A postmortem, an upsolve queue and scheduled reviews.',
    steps: [
      { title: 'Open your last contest', description: 'Revisit the scoreboard and your submissions.', module: 'contest', actionKind: 'contest-review', fallback: { label: 'Open contests', to: ROUTES.contests }, coachIntent: 'contest', estimatedMinutes: 5 },
      { title: 'Write a postmortem', description: 'Note what went well and what cost you time.', module: 'contest', actionKind: 'contest-review', fallback: { label: 'Contest learning', to: ROUTES.contests }, coachIntent: 'contest', estimatedMinutes: 15 },
      { title: 'Queue upsolves', description: 'Add unsolved problems to your upsolve queue.', module: 'contest', actionKind: 'open-upsolve', fallback: { label: 'Open upsolve', to: ROUTES.upsolve }, coachIntent: 'contest', estimatedMinutes: 10 },
      { title: 'Schedule reviews', description: 'Add the new patterns to spaced repetition.', module: 'revision', actionKind: 'open-revision', fallback: { label: 'Open revision', to: ROUTES.revision }, coachIntent: 'revision', estimatedMinutes: 5, optional: true },
    ],
  },
  'interview-prep': {
    name: 'Interview Preparation',
    description: 'A targeted path toward interview-ready.',
    category: 'Interview',
    difficulty: 'intense',
    expectedOutcome: 'Close your biggest interview gaps with focused practice.',
    steps: [
      { title: 'Check interview readiness', description: 'See where you stand and the key gaps.', module: 'analytics', actionKind: 'open-analytics', fallback: { label: 'Open analytics', to: ROUTES.insights }, coachIntent: 'interview', estimatedMinutes: 5 },
      { title: 'Target weak topics', description: 'Focus on the topics most likely to appear.', module: 'analytics', actionKind: 'practice-pattern', fallback: { label: 'View weaknesses', to: ROUTES.weaknesses }, coachIntent: 'interview', estimatedMinutes: 30 },
      { title: 'Timed practice', description: 'Solve medium problems under interview conditions.', module: 'learning', actionKind: 'practice-pattern', fallback: { label: 'Practice problems', to: ROUTES.problems }, coachIntent: 'interview', estimatedMinutes: 45 },
      { title: 'Review notebook', description: 'Skim your patterns to lock in recognition.', module: 'knowledge', actionKind: 'open-notebook', fallback: { label: 'Open notebook', to: ROUTES.notebook }, coachIntent: 'notebook', estimatedMinutes: 10, optional: true },
    ],
  },
  'phase-completion': {
    name: 'Phase Completion Push',
    description: 'Finish your current phase strong.',
    category: 'Learning',
    difficulty: 'moderate',
    expectedOutcome: 'Close out remaining topics and at-risk reviews in the phase.',
    steps: [
      { title: 'Review phase mastery', description: 'See what is left in your current phase.', module: 'analytics', actionKind: 'open-analytics', fallback: { label: 'Open analytics', to: ROUTES.recommendations }, coachIntent: 'analytics', estimatedMinutes: 5 },
      { title: 'Clear at-risk reviews', description: 'Protect mastery before advancing.', module: 'revision', actionKind: 'open-revision', fallback: { label: 'Open revision', to: ROUTES.revision }, coachIntent: 'revision', estimatedMinutes: 15 },
      { title: 'Finish remaining topics', description: 'Work through the last topics in the phase.', module: 'learning', actionKind: 'open-topic', fallback: { label: 'Continue learning', to: ROUTES.roadmap }, coachIntent: 'study-plan', estimatedMinutes: 40 },
      { title: 'Reflect on the phase', description: 'Note lessons and gaps before moving on.', module: 'knowledge', actionKind: 'open-notebook', fallback: { label: 'Open notebook', to: ROUTES.notebook }, coachIntent: 'notebook', estimatedMinutes: 10, optional: true },
    ],
  },
};

/**
 * WorkflowEngine (Module 7 · Sprint 4). Generates STRUCTURED workflows — ordered
 * sequences of SUGGESTED steps — from templates populated with the learner's live
 * context. A workflow is a plan the learner drives step by step (each step is a
 * deep link); it never runs autonomously. Reuses the ActionGenerator + route table
 * so every step deep-links consistently into existing modules.
 */
export const workflowEngine = {
  /** Template metadata only (no context needed) — for previews / catalogues. */
  templates() {
    return (Object.keys(T) as WorkflowKey[]).map((key) => ({
      key,
      name: T[key].name,
      description: T[key].description,
      category: T[key].category,
      difficulty: T[key].difficulty,
      stepCount: T[key].steps.length,
      estimatedMinutes: T[key].steps.reduce((s, st) => s + st.estimatedMinutes, 0),
    }));
  },

  /** Build one workflow, resolving each step's action from the live context. */
  build(context: AIContext, key: WorkflowKey): WorkflowDTO {
    const tpl = T[key];
    const steps: WorkflowStepDTO[] = tpl.steps.map((s, i) => ({
      id: `${key}-${i + 1}`,
      order: i + 1,
      title: s.title,
      description: s.description,
      module: s.module,
      action: resolveStepAction(context, s),
      coachIntent: s.coachIntent,
      estimatedMinutes: s.estimatedMinutes,
      optional: Boolean(s.optional),
    }));
    const modules: string[] = [];
    for (const st of steps) if (!modules.includes(st.module)) modules.push(st.module);

    return {
      id: key,
      key,
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      difficulty: tpl.difficulty,
      estimatedMinutes: steps.reduce((sum, st) => sum + st.estimatedMinutes, 0),
      modules,
      steps,
      expectedOutcome: tpl.expectedOutcome,
      generatedAt: new Date().toISOString(),
      status: null,
    };
  },

  /** Build every workflow for the current context. */
  buildAll(context: AIContext): WorkflowDTO[] {
    return (Object.keys(T) as WorkflowKey[]).map((key) => this.build(context, key));
  },

  /** Recommend the single most relevant workflow for the current context. */
  suggest(context: AIContext): WorkflowKey {
    const rev = sectionData<{ overdueCount: number; dueTodayCount: number }>(context, 'revision');
    const contest = sectionData<{ pendingUpsolve: number }>(context, 'contest');
    if (contest && contest.pendingUpsolve > 0) return 'contest-review';
    if (rev && rev.overdueCount + rev.dueTodayCount >= 5) return 'revision-session';
    return 'study-session';
  },

  isKey(value: string): value is WorkflowKey {
    return value in T;
  },
};

/** Resolve a step's action from context, falling back to a static route. */
function resolveStepAction(context: AIContext, s: StepScaffold): MentorAction | null {
  const fromContext = actionGenerator.byKind(context, s.actionKind);
  if (fromContext) return fromContext;
  if (!s.fallback) return null;
  return { id: `${s.actionKind}-fallback`, label: s.fallback.label, kind: s.actionKind, to: s.fallback.to, module: s.module };
}
