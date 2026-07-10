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
  Lightbulb,
  Route,
  MessageSquare,
  Trophy,
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

/** Map a timeline entry icon name / workflow module to a lucide component. */
const TIMELINE_ICONS: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  route: Route,
  'message-square': MessageSquare,
  trophy: Trophy,
  // module icons (workflow steps)
  learning: GraduationCap,
  revision: CalendarClock,
  contest: Swords,
  analytics: BarChart3,
  knowledge: NotebookPen,
};

export function timelineIcon(name: string): LucideIcon {
  return TIMELINE_ICONS[name] ?? Lightbulb;
}

/** Icon for a CP-OS module name (workflow step badges). */
export function moduleIcon(module: string): LucideIcon {
  return TIMELINE_ICONS[module] ?? Layers;
}
