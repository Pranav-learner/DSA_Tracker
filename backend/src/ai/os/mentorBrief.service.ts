import { sectionData } from '../coaches/actions.js';
import type { AIContext } from '../types/ai.types.js';
import type { LearningSnapshotDTO } from '../dto/ai.dto.js';
import type { BriefKind, BriefSection, MentorAction, MentorBriefDTO, RecommendationDTO, WorkflowKey } from './types.js';

/** The assembled inputs a brief formats (built once by the AI OS facade). */
export interface BriefInput {
  snapshot: LearningSnapshotDTO;
  context: AIContext;
  recommendations: RecommendationDTO[];
  suggestedWorkflow: { key: WorkflowKey; name: string } | null;
  quickStart: MentorAction[];
}

const META: Record<BriefKind, { title: string; period: string }> = {
  daily: { title: 'Daily Brief', period: 'Today' },
  weekly: { title: 'Weekly Brief', period: 'This week' },
  contest: { title: 'Contest Brief', period: 'Contest prep' },
  revision: { title: 'Revision Brief', period: 'Revision' },
  'learning-health': { title: 'Learning Health Brief', period: 'Health check' },
  'phase-completion': { title: 'Phase Completion Brief', period: 'Current phase' },
};

/**
 * MentorBriefService (Module 7 · Sprint 4). Produces on-demand mentor briefs from
 * the learner's live snapshot + context. Deterministic and rule-based — no LLM
 * call — so a brief is always available (graceful degradation) and fully
 * provider-independent. Briefs are never scheduled or pushed; they are generated
 * when the learner asks.
 */
export const mentorBriefService = {
  build(kind: BriefKind, input: BriefInput): MentorBriefDTO {
    const { snapshot: s, context, recommendations } = input;
    const health = sectionData<{ overallScore: number; overallStatus: string }>(context, 'analytics-health');
    const plan = sectionData<{ estimatedStudyMinutes: number | null }>(context, 'learning-plan');

    const top = recommendations[0] ?? null;
    const estimatedStudyMinutes = plan?.estimatedStudyMinutes ?? 30;

    return {
      kind,
      title: META[kind].title,
      periodLabel: META[kind].period,
      generatedAt: new Date().toISOString(),
      headline: headlineFor(kind, input),
      todaysFocus: s.recommendation?.title ?? (s.currentTopic ? `Advance ${s.currentTopic}` : 'Keep your momentum going'),
      highestPriorityTask: top?.title ?? s.recommendation?.title ?? null,
      revisionDue: s.revisionDue,
      contestReadiness: s.contestReadiness,
      learningHealth: health ? { score: health.overallScore, status: health.overallStatus } : null,
      estimatedStudyMinutes,
      suggestedWorkflow: input.suggestedWorkflow,
      quickStart: input.quickStart.slice(0, 4),
      sections: sectionsFor(kind, input),
      recommendations,
    };
  },
};

function headlineFor(kind: BriefKind, { snapshot: s }: BriefInput): string {
  switch (kind) {
    case 'revision':
      return s.revisionDue > 0 ? `${s.revisionDue} reviews are waiting for you.` : 'Your revision queue is clear — nice work.';
    case 'contest':
      return s.contestReadiness !== null ? `Contest readiness sits at ${s.contestReadiness}/100.` : 'Log a contest to start tracking readiness.';
    case 'learning-health':
      return `Your current streak is ${s.currentStreak} day${s.currentStreak === 1 ? '' : 's'}.`;
    case 'phase-completion':
      return s.currentPhase ? `You're working through ${s.currentPhase}.` : 'Pick a phase to start your roadmap.';
    case 'weekly':
      return 'Here’s how your week is shaping up.';
    default:
      return s.currentTopic ? `Today, focus on ${s.currentTopic}.` : 'Let’s plan a focused session.';
  }
}

function sectionsFor(kind: BriefKind, input: BriefInput): BriefSection[] {
  const { snapshot: s, context } = input;
  const out: BriefSection[] = [];
  const push = (title: string, body: string) => body && out.push({ title, body });

  // Shared "at a glance" line.
  push(
    'At a glance',
    [
      s.currentPhase ? `Phase: ${s.currentPhase}.` : '',
      s.currentTopic ? `Topic: ${s.currentTopic} (mastery ${s.mastery}%).` : '',
      `Streak: ${s.currentStreak}d.`,
    ]
      .filter(Boolean)
      .join(' '),
  );

  if (kind === 'daily' || kind === 'weekly' || kind === 'learning-health') {
    push('Weak & strong', `Weakest: ${s.weakestPattern ?? 'n/a'}. Strongest: ${s.strongestPattern ?? 'n/a'}.`);
    if (s.revisionDue > 0) push('Revision', `${s.revisionDue} reviews due — clear them before new material.`);
  }
  if (kind === 'revision') {
    const rev = sectionData<{ overdueCount: number; dueTodayCount: number; atRiskCount: number }>(context, 'revision');
    if (rev) push('Queue', `${rev.overdueCount} overdue · ${rev.dueTodayCount} due today · ${rev.atRiskCount} at risk.`);
  }
  if (kind === 'contest') {
    const readiness = sectionData<{ weakAreas: string[]; strongAreas: string[] }>(context, 'contest-readiness');
    if (readiness) push('Readiness', `Strong: ${readiness.strongAreas.join(', ') || 'n/a'}. Weak: ${readiness.weakAreas.join(', ') || 'n/a'}.`);
  }
  if (kind === 'learning-health') {
    const h = sectionData<{ overallScore: number; overallStatus: string; masteredTopics: number; topicsAtRisk: number }>(context, 'analytics-health');
    if (h) push('Health', `Score ${h.overallScore}/100 (${h.overallStatus}). ${h.masteredTopics} mastered, ${h.topicsAtRisk} at risk.`);
  }
  if (kind === 'phase-completion') {
    const learner = sectionData<{ completionPercent: number; topicsRemaining: number }>(context, 'learner-profile');
    if (learner) push('Progress', `${learner.completionPercent}% complete · ${learner.topicsRemaining} topics remaining.`);
  }

  return out;
}
