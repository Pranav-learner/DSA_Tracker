import type { LearningSnapshotDTO, SuggestedPromptDTO } from '../dto/ai.dto.js';

/**
 * SuggestionService — generates PERSONALISED prompt suggestions from the
 * learner's current snapshot (not a static list). Each suggestion carries the
 * intent + slash command it maps to, so tapping it preselects the right context
 * profile. Rule-based for Sprint 1/2; an AI generator can replace `generate`
 * behind the same signature later.
 */
export const suggestionService = {
  generate(snapshot: LearningSnapshotDTO): SuggestedPromptDTO[] {
    const out: SuggestedPromptDTO[] = [];
    const add = (id: string, text: string, intent: SuggestedPromptDTO['intent'], command: string | null, reason: string) =>
      out.push({ id, text, intent, command, reason });

    // Always: what to study today.
    add('study-today', 'What should I study today?', 'study-plan', 'study', 'Daily focus based on your plan.');

    if (snapshot.weakestPattern) {
      add('weak-pattern', `Why am I struggling with ${snapshot.weakestPattern}?`, 'analytics', 'analytics', `${snapshot.weakestPattern} is your weakest area.`);
      add('explain-weak', `Explain my weakest pattern.`, 'pattern', 'notebook', 'Turn a weakness into a strength.');
    }

    if (snapshot.revisionDue > 0) {
      add('revision-backlog', 'Summarize my revision backlog.', 'revision', 'revision', `${snapshot.revisionDue} reviews due.`);
    }

    if (snapshot.contestReadiness !== null) {
      add('contest-ready', 'Am I ready for my next Codeforces contest?', 'contest', 'contest', `Contest readiness ${snapshot.contestReadiness}/100.`);
    }

    if (snapshot.currentPhase) {
      add('phase-progress', `How close am I to completing ${snapshot.currentPhase}?`, 'study-plan', 'study', 'Track your current phase.');
    }

    if (snapshot.currentTopic) {
      add('explain-topic', `Give me practice ideas for ${snapshot.currentTopic}.`, 'study-plan', 'study', `You're on ${snapshot.currentTopic}.`);
    }

    // De-dupe by id and cap at 6.
    const seen = new Set<string>();
    return out.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))).slice(0, 6);
  },
};
