import { BaseCoach } from './baseCoach.js';
import { sectionData, action, ROUTES } from './actions.js';
import type { AIContext } from '../types/ai.types.js';
import type { CoachAction, CoachContextSpec, CoachRelatedTopic } from './types.js';

interface NotebookData {
  items: { id: string; title: string; pattern: string; confidence: number; topicId: string }[];
}
interface KnowledgeData {
  knowledgeEntries: number;
  patternsPending: number;
  coveragePercent: number;
}

/**
 * NotebookCoach — explains and improves notebook entries. Orchestrates the
 * Knowledge Engine, Notebook and Revision (via context) to summarise entries,
 * suggest improvements, flag missing concepts and cross-link related topics.
 */
export class NotebookCoach extends BaseCoach {
  readonly id = 'notebook';
  readonly intent = 'notebook' as const;
  readonly title = 'Notebook Coach';
  readonly description = 'Reviews and strengthens your pattern notebook — summaries, gaps and cross-links.';
  readonly icon = 'notebook-pen';
  readonly templateName = 'notebook';
  readonly outputs = ['Summary', 'Improvement Suggestions', 'Missing Concepts', 'Related Topics'];
  readonly baseFollowUps = [
    'How can I improve this notebook entry?',
    'What am I missing in my notes?',
    'Which entries need more detail?',
  ];
  readonly contextSpec: CoachContextSpec = {
    required: ['knowledge'],
    optional: ['revision', 'learning'],
    maxContextTokens: 1400,
    priority: ['learner-profile', 'notebook-entries', 'knowledge', 'revision', 'learning-plan'],
  };

  protected recommendations(context: AIContext): string[] {
    const out: string[] = [];
    const k = sectionData<KnowledgeData>(context, 'knowledge');
    if (k) {
      if (k.coveragePercent < 80) out.push(`Notebook coverage is ${k.coveragePercent}% — document a few more solved problems.`);
      if (k.patternsPending > 0) out.push(`${k.patternsPending} patterns are undocumented — capture them while fresh.`);
    }
    const nb = sectionData<NotebookData>(context, 'notebook-entries');
    const thin = nb?.items.filter((e) => e.confidence < 65).slice(0, 2) ?? [];
    for (const e of thin) out.push(`Add recognition keywords and complexity to "${e.title}".`);
    if (!out.length) out.push('Your notebook is healthy — add an "alternative approaches" note to a recent entry.');
    return out;
  }

  protected relatedTopics(context: AIContext): CoachRelatedTopic[] {
    const nb = sectionData<NotebookData>(context, 'notebook-entries');
    const items = (nb?.items ?? []).slice(0, 5).map((e) => ({ id: e.id, title: `${e.title} (${e.pattern})`, to: ROUTES.notebookEntry(e.id) }));
    return items.length ? items : super.relatedTopics(context);
  }

  suggestedActions(context: AIContext): CoachAction[] {
    const out: CoachAction[] = [];
    const nb = sectionData<NotebookData>(context, 'notebook-entries');
    const entry = nb?.items[0];
    if (entry) out.push(action(`edit-note-${entry.id}`, `Improve "${entry.title}"`, 'open-notebook', ROUTES.notebookEntry(entry.id), { primary: true }));
    out.push(action('open-notebook', 'Open notebook', 'open-notebook', ROUTES.notebook));
    out.push(action('start-revision', 'Schedule a review', 'open-revision', ROUTES.revision));
    return out;
  }
}
