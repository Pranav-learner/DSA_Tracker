import { BaseCoach } from './baseCoach.js';
import { sectionData, action, ROUTES } from './actions.js';
import type { AIContext } from '../types/ai.types.js';
import type { CoachAction, CoachContextSpec, CoachRelatedTopic } from './types.js';

interface ContestData {
  totalContests: number;
  currentRating: number | null;
  recentRatingChange: number | null;
  pendingUpsolve: number;
  latestContestId: string | null;
}
interface ReadinessData {
  overall: number;
  status: string;
  strongAreas: string[];
  weakAreas: string[];
}

/**
 * ContestCoach — improves contest performance. Orchestrates the Contest Engine,
 * Contest Analytics and Pattern Intelligence (via context) to give feedback,
 * strategy, weak-pattern focus and upsolve priorities.
 */
export class ContestCoach extends BaseCoach {
  readonly id = 'contest';
  readonly intent = 'contest' as const;
  readonly title = 'Contest Coach';
  readonly description = 'Reviews contest performance and sets strategy, weak patterns and upsolve priorities.';
  readonly icon = 'swords';
  readonly templateName = 'contest';
  readonly outputs = ['Contest Feedback', 'Contest Strategy', 'Weak Contest Patterns', 'Upsolve Priorities'];
  readonly baseFollowUps = [
    'Am I ready for my next contest?',
    'What went wrong in my last contest?',
    'Which problems should I upsolve first?',
  ];
  readonly contextSpec: CoachContextSpec = {
    required: ['contest'],
    optional: ['analytics', 'gamification'],
    maxContextTokens: 1500,
    priority: ['learner-profile', 'contest', 'contest-readiness', 'weak-patterns', 'strong-patterns', 'progression'],
  };

  protected recommendations(context: AIContext): string[] {
    const out: string[] = [];
    const c = sectionData<ContestData>(context, 'contest');
    const r = sectionData<ReadinessData>(context, 'contest-readiness');
    if (r) {
      out.push(`Contest readiness is ${r.overall}/100 (${r.status}).`);
      if (r.weakAreas.length) out.push(`Focus your prep on: ${r.weakAreas.join(', ')}.`);
    }
    if (c) {
      if (c.pendingUpsolve > 0) out.push(`Upsolve ${c.pendingUpsolve} pending problems while the ideas are fresh.`);
      if (c.totalContests === 0) out.push('No contests yet — start with a virtual contest to establish a baseline.');
    }
    return out;
  }

  protected relatedTopics(context: AIContext): CoachRelatedTopic[] {
    const r = sectionData<ReadinessData>(context, 'contest-readiness');
    const topics = (r?.weakAreas ?? []).map((title) => ({ id: null, title, to: null }));
    return topics.length ? topics.slice(0, 5) : super.relatedTopics(context);
  }

  suggestedActions(context: AIContext): CoachAction[] {
    const out: CoachAction[] = [];
    const c = sectionData<ContestData>(context, 'contest');
    if (c && c.pendingUpsolve > 0) out.push(action('open-upsolve', 'Open upsolve queue', 'open-upsolve', ROUTES.upsolve, { primary: true }));
    if (c?.latestContestId) out.push(action('review-contest', 'Review last contest', 'contest-review', ROUTES.contestLearning(c.latestContestId)));
    out.push(action('open-contests', 'Contest dashboard', 'open-contest', ROUTES.contests));
    return out;
  }
}
