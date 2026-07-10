import { BaseCoach } from './baseCoach.js';
import { sectionData, action, ROUTES } from './actions.js';
import type { AIContext } from '../types/ai.types.js';
import type { CoachAction, CoachContextSpec } from './types.js';

interface RevisionData {
  dueTodayCount: number;
  overdueCount: number;
  completedToday: number;
  estimatedReviewMinutes: number;
  averageRetention: number;
  atRiskCount: number;
  hasActiveSession: boolean;
}
interface KnowledgeData {
  patternsPending: number;
  coveragePercent: number;
}

/**
 * RevisionCoach — guides spaced-repetition review. Orchestrates the Revision
 * Engine, Retention and Knowledge Engine (via context) to prioritise overdue and
 * at-risk items and propose a sensible review order.
 */
export class RevisionCoach extends BaseCoach {
  readonly id = 'revision';
  readonly intent = 'revision' as const;
  readonly title = 'Revision Coach';
  readonly description = 'Prioritises overdue and at-risk reviews and sets a smart revision order.';
  readonly icon = 'calendar-clock';
  readonly templateName = 'revision';
  readonly outputs = ['Revision Plan', 'High Priority Reviews', 'Confidence Gaps', 'Revision Order'];
  readonly baseFollowUps = [
    'Summarize my revision backlog.',
    'What should I review first today?',
    'Which topics am I about to forget?',
  ];
  readonly contextSpec: CoachContextSpec = {
    required: ['revision'],
    optional: ['learning', 'knowledge', 'analytics'],
    maxContextTokens: 1500,
    priority: ['learner-profile', 'revision', 'weak-patterns', 'knowledge', 'learning-plan', 'analytics-health'],
  };

  protected recommendations(context: AIContext): string[] {
    const out: string[] = [];
    const rev = sectionData<RevisionData>(context, 'revision');
    if (rev) {
      if (rev.overdueCount > 0) out.push(`Clear ${rev.overdueCount} overdue reviews first — they decay fastest.`);
      if (rev.dueTodayCount > 0) out.push(`Complete ${rev.dueTodayCount} reviews due today (~${rev.estimatedReviewMinutes} min).`);
      if (rev.atRiskCount > 0) out.push(`${rev.atRiskCount} items are at risk — reinforce them before they slip further.`);
      if (rev.dueTodayCount + rev.overdueCount === 0) out.push('Nothing due — do a light recall pass on a recent topic to stay sharp.');
    }
    const k = sectionData<KnowledgeData>(context, 'knowledge');
    if (k && k.patternsPending > 0) out.push(`Document ${k.patternsPending} pending patterns so they enter the review cycle.`);
    return out;
  }

  suggestedActions(context: AIContext): CoachAction[] {
    const out: CoachAction[] = [];
    const rev = sectionData<RevisionData>(context, 'revision');
    if (rev?.hasActiveSession) out.push(action('resume-revision', 'Resume review session', 'open-revision', ROUTES.revisionSession, { primary: true }));
    else if (rev && rev.dueTodayCount + rev.overdueCount > 0)
      out.push(action('start-revision', 'Start revision', 'open-revision', ROUTES.revisionSession, { primary: true }));
    out.push(action('open-revision-hub', 'Open revision hub', 'open-revision', ROUTES.revision));
    out.push(action('review-notebook', 'Review notebook', 'open-notebook', ROUTES.notebook));
    return out;
  }
}
