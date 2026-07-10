import { BaseCoach } from './baseCoach.js';
import { sectionData, action, ROUTES, entityRoute } from './actions.js';
import type { AIContext, AiIntent } from '../types/ai.types.js';
import type { CoachAction, CoachContextSpec } from './types.js';

interface LearningPlanData {
  title: string;
  message: string;
  actionLabel: string;
  actionTo: string;
  topicId: string | null;
  topicsRemaining: number;
  estimatedStudyMinutes: number | null;
}
interface WeakData {
  items: { title: string; entityType: string; entityId: string | null; hint: string }[];
}
interface RevisionData {
  dueTodayCount: number;
  overdueCount: number;
}

/**
 * StudyCoach — helps the learner decide WHAT to study. Orchestrates the Learning
 * Engine (recommendation), Revision Engine (due load) and Analytics (weak areas)
 * via context; also the registry's fallback coach for general/analytics chat.
 */
export class StudyCoach extends BaseCoach {
  readonly id = 'study';
  readonly intent = 'study-plan' as const;
  readonly extraIntents: AiIntent[] = ['general', 'unknown', 'analytics'];
  readonly title = 'Study Coach';
  readonly description = 'Decides what to study next from your roadmap, revision load and weak areas.';
  readonly icon = 'graduation-cap';
  readonly templateName = 'study';
  readonly outputs = ["Today's Study Plan", 'Learning Priorities', 'Estimated Study Time', 'Suggested Problems'];
  readonly baseFollowUps = [
    'What should I study today?',
    'How much time should I spend today?',
    'Which weak area should I prioritise?',
  ];
  readonly contextSpec: CoachContextSpec = {
    required: ['learning'],
    optional: ['revision', 'analytics', 'gamification'],
    maxContextTokens: 1600,
    priority: ['learner-profile', 'learning-plan', 'weak-patterns', 'revision', 'analytics-health', 'strong-patterns', 'progression'],
  };

  protected recommendations(context: AIContext): string[] {
    const out: string[] = [];
    const plan = sectionData<LearningPlanData>(context, 'learning-plan');
    if (plan) {
      out.push(`${plan.title}: ${plan.message}`);
      if (plan.estimatedStudyMinutes) out.push(`Plan for about ${plan.estimatedStudyMinutes} minutes of focused study today.`);
    }
    const weak = sectionData<WeakData>(context, 'weak-patterns');
    for (const w of weak?.items.slice(0, 2) ?? []) out.push(`Strengthen ${w.title} — ${w.hint || 'practice a few targeted problems'}.`);
    const rev = sectionData<RevisionData>(context, 'revision');
    if (rev && rev.dueTodayCount + rev.overdueCount > 0) out.push(`Clear ${rev.dueTodayCount + rev.overdueCount} pending reviews before new material.`);
    return out;
  }

  suggestedActions(context: AIContext): CoachAction[] {
    const out: CoachAction[] = [];
    const plan = sectionData<LearningPlanData>(context, 'learning-plan');
    if (plan?.actionTo) out.push(action('continue-learning', plan.actionLabel || 'Continue learning', 'continue-study', plan.actionTo, { primary: true }));
    const rev = sectionData<RevisionData>(context, 'revision');
    if (rev && rev.dueTodayCount + rev.overdueCount > 0) out.push(action('start-revision', 'Start revision', 'open-revision', ROUTES.revision));
    const weak = sectionData<WeakData>(context, 'weak-patterns');
    const firstWeak = weak?.items[0];
    if (firstWeak) {
      const to = entityRoute(firstWeak.entityType, firstWeak.entityId);
      if (to) out.push(action(`practice-${firstWeak.entityId}`, `Practice ${firstWeak.title}`, 'practice-problem', to));
    }
    out.push(action('view-recommendations', 'View recommendations', 'open-analytics', ROUTES.recommendations));
    return out;
  }
}
