import { BaseCoach } from './baseCoach.js';
import { sectionData, action, ROUTES, entityRoute } from './actions.js';
import type { AIContext } from '../types/ai.types.js';
import type { CoachAction, CoachContextSpec } from './types.js';

interface HealthData {
  overallScore: number;
  overallStatus: string;
  masteredTopics: number;
  topicsAtRisk: number;
}
interface LearnerData {
  completionPercent: number;
  mastery: number;
  currentTopicId: string | null;
}
interface WeakData {
  items: { title: string; entityType: string; entityId: string | null; hint: string }[];
}

/**
 * InterviewCoach — evaluates interview readiness. Orchestrates the Learning
 * Engine, Analytics, pattern coverage and mastery (via context) to give a
 * readiness read, weak topics, practice suggestions and a study plan.
 */
export class InterviewCoach extends BaseCoach {
  readonly id = 'interview';
  readonly intent = 'interview' as const;
  readonly title = 'Interview Coach';
  readonly description = 'Assesses interview readiness and builds a targeted practice plan.';
  readonly icon = 'briefcase';
  readonly templateName = 'interview';
  readonly outputs = ['Interview Readiness', 'Weak Topics', 'Practice Suggestions', 'Study Plan'];
  readonly baseFollowUps = [
    'Am I ready for interviews?',
    'Which topics are my interview weak spots?',
    'Build me a 2-week interview plan.',
  ];
  readonly contextSpec: CoachContextSpec = {
    required: ['learning', 'analytics'],
    optional: ['knowledge', 'gamification'],
    maxContextTokens: 1700,
    priority: ['learner-profile', 'analytics-health', 'weak-patterns', 'learning-plan', 'knowledge', 'strong-patterns', 'progression'],
  };

  protected recommendations(context: AIContext): string[] {
    const out: string[] = [];
    const h = sectionData<HealthData>(context, 'analytics-health');
    const learner = sectionData<LearnerData>(context, 'learner-profile');
    if (learner) out.push(`You've mastered ${learner.completionPercent}% of the roadmap at ${learner.mastery}% average mastery.`);
    if (h) {
      out.push(`Learning health is ${h.overallScore}/100 (${h.overallStatus}); ${h.masteredTopics} topics mastered.`);
      if (h.topicsAtRisk > 0) out.push(`Shore up ${h.topicsAtRisk} at-risk topics before interviewing.`);
    }
    const weak = sectionData<WeakData>(context, 'weak-patterns');
    for (const w of weak?.items.slice(0, 2) ?? []) out.push(`Interview gap: ${w.title} — ${w.hint || 'practice medium-difficulty problems'}.`);
    return out;
  }

  suggestedActions(context: AIContext): CoachAction[] {
    const out: CoachAction[] = [];
    const weak = sectionData<WeakData>(context, 'weak-patterns');
    const w = weak?.items[0];
    const to = w ? entityRoute(w.entityType, w.entityId) : null;
    if (w && to) out.push(action(`focus-${w.entityId}`, `Focus on ${w.title}`, 'open-pattern', to, { primary: true }));
    out.push(action('practice-problems', 'Practice problems', 'practice-problem', ROUTES.problems));
    out.push(action('view-weaknesses', 'Review weak areas', 'open-analytics', ROUTES.weaknesses));
    out.push(action('open-roadmap', 'Open roadmap', 'open-roadmap', ROUTES.roadmap));
    return out;
  }
}
