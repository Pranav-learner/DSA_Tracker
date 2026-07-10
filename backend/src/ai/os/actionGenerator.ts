import { sectionData, entityRoute, ROUTES } from '../coaches/actions.js';
import type { AIContext } from '../types/ai.types.js';
import type { MentorAction } from './types.js';

/**
 * ActionGenerator (Module 7 · Sprint 4). Converts the learner's live CONTEXT into
 * concrete, deep-linked CP-OS actions — "Open Topic", "Start Revision", "Resume
 * Upsolve", "View Notebook", "Practice Pattern", "Open Contest", "Open
 * Analytics". Every action is a route the LEARNER chooses to follow; the AI never
 * executes it. Reuses the same context readers + route table as the coaches, so
 * deep links stay consistent across the whole AI layer.
 */

interface LearnerData {
  currentTopicId: string | null;
  currentTopicTitle: string | null;
}
interface PlanData {
  actionTo: string;
  actionLabel: string;
}
interface RevisionData {
  dueTodayCount: number;
  overdueCount: number;
  hasActiveSession: boolean;
}
interface ContestData {
  totalContests: number;
  pendingUpsolve: number;
  latestContestId: string | null;
}
interface NotebookData {
  items: { id: string; title: string }[];
}
interface WeakData {
  items: { title: string; entityType: string; entityId: string | null }[];
}

const mk = (id: string, label: string, kind: string, to: string, module: string, primary = false): MentorAction => ({
  id,
  label,
  kind,
  to,
  module,
  primary,
});

export const actionGenerator = {
  /**
   * Generate the contextual action set for a built context. Ordered by relevance;
   * deduped by id and capped.
   */
  generate(context: AIContext, max = 8): MentorAction[] {
    const out: MentorAction[] = [];

    const plan = sectionData<PlanData>(context, 'learning-plan');
    if (plan?.actionTo) out.push(mk('continue-learning', plan.actionLabel || 'Continue learning', 'continue-study', plan.actionTo, 'learning', true));

    const learner = sectionData<LearnerData>(context, 'learner-profile');
    if (learner?.currentTopicId) out.push(mk('open-topic', `Open ${learner.currentTopicTitle ?? 'current topic'}`, 'open-topic', ROUTES.topic(learner.currentTopicId), 'learning'));

    const rev = sectionData<RevisionData>(context, 'revision');
    if (rev?.hasActiveSession) out.push(mk('resume-revision', 'Resume review session', 'open-revision', ROUTES.revisionSession, 'revision'));
    else if (rev && rev.dueTodayCount + rev.overdueCount > 0) out.push(mk('start-revision', 'Start revision', 'open-revision', ROUTES.revision, 'revision'));

    const weak = sectionData<WeakData>(context, 'weak-patterns');
    const w = weak?.items[0];
    const weakTo = w ? entityRoute(w.entityType, w.entityId) : null;
    if (w && weakTo) out.push(mk(`practice-${w.entityId}`, `Practice ${w.title}`, 'practice-pattern', weakTo, 'analytics'));

    const nb = sectionData<NotebookData>(context, 'notebook-entries');
    const entry = nb?.items[0];
    out.push(entry ? mk('view-notebook', `Open "${entry.title}"`, 'open-notebook', ROUTES.notebookEntry(entry.id), 'knowledge') : mk('view-notebook', 'View notebook', 'open-notebook', ROUTES.notebook, 'knowledge'));

    const contest = sectionData<ContestData>(context, 'contest');
    if (contest && contest.pendingUpsolve > 0) out.push(mk('resume-upsolve', 'Resume upsolve queue', 'open-upsolve', ROUTES.upsolve, 'contest'));
    if (contest?.latestContestId) out.push(mk('contest-review', 'Review last contest', 'contest-review', ROUTES.contestLearning(contest.latestContestId), 'contest'));
    else if (contest && contest.totalContests > 0) out.push(mk('open-contest', 'Open contests', 'open-contest', ROUTES.contests, 'contest'));

    out.push(mk('open-analytics', 'Open analytics', 'open-analytics', ROUTES.recommendations, 'analytics'));

    // Dedupe by id, cap.
    const seen = new Set<string>();
    return out.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true))).slice(0, max);
  },

  /** Find a generated action by id (used by workflows to attach a step's action). */
  byKind(context: AIContext, kind: string): MentorAction | null {
    return this.generate(context, 20).find((a) => a.kind === kind) ?? null;
  },
};
