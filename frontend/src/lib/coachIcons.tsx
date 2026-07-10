import {
  GraduationCap,
  CalendarClock,
  Swords,
  Shapes,
  NotebookPen,
  Briefcase,
  Bot,
  ArrowRight,
  BookOpen,
  Target,
  BarChart3,
  Map as MapIcon,
  Layers,
  type LucideIcon,
} from 'lucide-react';

/** Map a coach's `icon` string (from the backend) to a lucide component. */
const COACH_ICONS: Record<string, LucideIcon> = {
  'graduation-cap': GraduationCap,
  'calendar-clock': CalendarClock,
  swords: Swords,
  shapes: Shapes,
  'notebook-pen': NotebookPen,
  briefcase: Briefcase,
};

export function coachIcon(name: string): LucideIcon {
  return COACH_ICONS[name] ?? Bot;
}

/** Map a suggested-action `kind` to a lucide component (for the action buttons). */
const ACTION_ICONS: Record<string, LucideIcon> = {
  'continue-study': ArrowRight,
  'open-revision': CalendarClock,
  'practice-problem': Target,
  'open-analytics': BarChart3,
  'open-notebook': NotebookPen,
  'open-pattern': Shapes,
  'open-contest': Swords,
  'contest-review': Swords,
  'open-upsolve': Layers,
  'open-roadmap': MapIcon,
  'open-topic': BookOpen,
};

export function actionIcon(kind: string): LucideIcon {
  return ACTION_ICONS[kind] ?? ArrowRight;
}
