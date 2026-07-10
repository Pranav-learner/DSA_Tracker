import { BaseCoach } from './baseCoach.js';
import { sectionData, action, ROUTES, entityRoute } from './actions.js';
import type { AIContext } from '../types/ai.types.js';
import type { CoachAction, CoachContextSpec } from './types.js';

interface NotebookData {
  items: { id: string; title: string; pattern: string; confidence: number; topicId: string }[];
}
interface WeakData {
  items: { title: string; entityType: string; entityId: string | null; hint: string }[];
}

/**
 * PatternCoach — teaches pattern recognition. Orchestrates the Knowledge Engine,
 * Pattern Intelligence and the Notebook (via context) to surface recognition
 * tips, common mistakes, pattern relationships and practice.
 */
export class PatternCoach extends BaseCoach {
  readonly id = 'pattern';
  readonly intent = 'pattern' as const;
  readonly title = 'Pattern Coach';
  readonly description = 'Teaches how to recognise and apply DSA patterns, with mistakes and practice.';
  readonly icon = 'shapes';
  readonly templateName = 'pattern';
  readonly outputs = ['Recognition Tips', 'Common Mistakes', 'Pattern Relationships', 'Practice Suggestions'];
  readonly baseFollowUps = [
    'How do I recognise this pattern?',
    'What mistakes should I avoid?',
    'Which problems practise this pattern?',
  ];
  readonly contextSpec: CoachContextSpec = {
    required: ['knowledge'],
    optional: ['analytics', 'gamification'],
    maxContextTokens: 1500,
    priority: ['learner-profile', 'notebook-entries', 'knowledge', 'weak-patterns', 'strong-patterns', 'progression'],
  };

  protected recommendations(context: AIContext): string[] {
    const out: string[] = [];
    const nb = sectionData<NotebookData>(context, 'notebook-entries');
    const low = nb?.items.filter((e) => e.confidence < 60).slice(0, 2) ?? [];
    for (const e of low) out.push(`Revisit "${e.title}" (${e.pattern}) — confidence is only ${e.confidence}%.`);
    const weak = sectionData<WeakData>(context, 'weak-patterns');
    for (const w of weak?.items.slice(0, 2) ?? []) out.push(`Drill ${w.title}: ${w.hint || 'do 2–3 representative problems'}.`);
    if (!out.length) out.push('Pick one pattern and solve three representative problems back-to-back to lock it in.');
    return out;
  }

  suggestedActions(context: AIContext): CoachAction[] {
    const out: CoachAction[] = [];
    const nb = sectionData<NotebookData>(context, 'notebook-entries');
    const entry = nb?.items[0];
    if (entry) out.push(action(`open-note-${entry.id}`, `Open "${entry.title}"`, 'open-notebook', ROUTES.notebookEntry(entry.id), { primary: true }));
    const weak = sectionData<WeakData>(context, 'weak-patterns');
    const w = weak?.items[0];
    const to = w ? entityRoute(w.entityType, w.entityId) : null;
    if (w && to) out.push(action(`pattern-${w.entityId}`, `Study ${w.title}`, 'open-pattern', to));
    out.push(action('open-patterns', 'Pattern intelligence', 'open-pattern', ROUTES.patterns));
    out.push(action('practice-problems', 'Practice problems', 'practice-problem', ROUTES.problems));
    return out;
  }
}
