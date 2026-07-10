import { coachRegistry } from './coachRegistry.js';
import { RevisionCoach } from './revisionCoach.js';
import { ContestCoach } from './contestCoach.js';
import { PatternCoach } from './patternCoach.js';
import { NotebookCoach } from './notebookCoach.js';
import { InterviewCoach } from './interviewCoach.js';
import { StudyCoach } from './studyCoach.js';

/**
 * Coach wiring (Module 7 · Sprint 3). Every coach registers itself here — the
 * ONLY place that knows the concrete coach set. Resolution is first-match-wins in
 * registration order, so the specialised coaches are registered first and the
 * StudyCoach (which claims the catch-all intents: general/unknown/analytics) is
 * registered LAST as the fallback. Adding a coach = one line here; nothing else
 * changes (no switch statements anywhere).
 */
coachRegistry
  .register(new RevisionCoach())
  .register(new ContestCoach())
  .register(new PatternCoach())
  .register(new NotebookCoach())
  .register(new InterviewCoach())
  .register(new StudyCoach()); // fallback — claims general/unknown/analytics

export { coachRegistry } from './coachRegistry.js';
export { CoachRegistry } from './coachRegistry.js';
export type { Coach, CoachResult, CoachMeta, CoachStructured, CoachAction } from './types.js';
