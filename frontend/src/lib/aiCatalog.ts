import type { AiIntent, ContextProfileName } from '@/types';
import type { ActiveCommand } from '@/store/slices/aiSlice';

/**
 * Front-end mirror of the backend AI catalogue (context profiles + slash
 * commands). Kept in sync with `backend/src/ai/context/profiles.ts`. Used by the
 * slash-command menu, the context-profile selector and the input parser so the
 * UI can preselect the right context before a message is even sent.
 */

export interface SlashCommandMeta extends ActiveCommand {
  description: string;
  /** A one-tap starter question used when the command is invoked as a quick action. */
  starter: string;
}

/** Slash commands — each preselects an intent + context profiles. */
export const SLASH_COMMANDS: SlashCommandMeta[] = [
  { command: 'study', intent: 'study-plan', profiles: ['learning', 'gamification', 'revision'], label: 'Study planning', description: 'Plan what to study next from your roadmap', starter: 'What should I study today?' },
  { command: 'revision', intent: 'revision', profiles: ['revision', 'learning'], label: 'Revision help', description: 'Work through your revision backlog', starter: 'Summarize my revision backlog and what to review first.' },
  { command: 'contest', intent: 'contest', profiles: ['contest', 'gamification'], label: 'Contest prep', description: 'Prepare for your next rated contest', starter: 'Am I ready for my next contest? What should I focus on?' },
  { command: 'notebook', intent: 'notebook', profiles: ['knowledge'], label: 'Notebook & patterns', description: 'Explore your pattern notebook', starter: 'Explain my weakest pattern using my notebook.' },
  { command: 'analytics', intent: 'analytics', profiles: ['analytics', 'gamification'], label: 'Analytics insight', description: 'Understand your strengths and weak spots', starter: 'Analyze my progress — what are my strengths and weak spots?' },
  { command: 'interview', intent: 'interview', profiles: ['gamification', 'knowledge', 'learning'], label: 'Interview prep', description: 'Get ready for coding interviews', starter: 'Help me prepare for coding interviews based on my progress.' },
  { command: 'help', intent: 'general', profiles: ['learning', 'conversation'], label: 'Help', description: 'What can the mentor do?', starter: 'What can you help me with?' },
];

const COMMAND_BY_NAME = new Map(SLASH_COMMANDS.map((c) => [c.command, c]));

/** Look up a slash command by its bare name (no leading slash). */
export function findSlashCommand(name: string): SlashCommandMeta | undefined {
  return COMMAND_BY_NAME.get(name.toLowerCase());
}

/**
 * Parse a leading slash command out of a message. Returns the matched command
 * (if any) and the remaining message text with the command token stripped.
 */
export function parseSlashCommand(text: string): { command: SlashCommandMeta | null; rest: string } {
  const match = text.match(/^\/([a-z]+)\b[ \t]*/i);
  if (!match) return { command: null, rest: text };
  const command = findSlashCommand(match[1]);
  if (!command) return { command: null, rest: text };
  return { command, rest: text.slice(match[0].length) };
}

/** Human labels for context profiles (for the profile selector chips). */
export const PROFILE_META: Record<ContextProfileName, { label: string; description: string }> = {
  learning: { label: 'Learning', description: 'Phase, topic, weak areas' },
  knowledge: { label: 'Knowledge', description: 'Notebook & representative problems' },
  revision: { label: 'Revision', description: 'Due reviews & retention' },
  contest: { label: 'Contests', description: 'History, rating & readiness' },
  analytics: { label: 'Analytics', description: 'Health, weak/strong patterns' },
  gamification: { label: 'Progression', description: 'Level, XP, streak' },
  conversation: { label: 'Activity', description: 'Recent learning activity' },
};

export const ALL_PROFILES = Object.keys(PROFILE_META) as ContextProfileName[];

/** Default profiles per intent (mirrors backend INTENT_PROFILES) — for the preview. */
export const INTENT_PROFILES: Record<AiIntent, ContextProfileName[]> = {
  general: ['learning', 'conversation'],
  'study-plan': ['learning', 'gamification', 'revision'],
  contest: ['contest', 'gamification'],
  revision: ['revision', 'learning'],
  notebook: ['knowledge'],
  pattern: ['knowledge', 'analytics', 'gamification'],
  interview: ['gamification', 'knowledge', 'learning'],
  analytics: ['analytics', 'gamification'],
  unknown: ['conversation'],
};

export const INTENT_LABEL: Record<AiIntent, string> = {
  general: 'General',
  'study-plan': 'Study Plan',
  contest: 'Contest',
  revision: 'Revision',
  notebook: 'Notebook',
  pattern: 'Pattern',
  interview: 'Interview',
  analytics: 'Analytics',
  unknown: 'General',
};
