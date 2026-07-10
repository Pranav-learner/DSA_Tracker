import { AIMentorWorkspace } from '@/components/ai';

/**
 * AIWorkspace — the AI Mentor page (Module 7 · Sprint 2). A full-height mentor
 * workspace: conversation sidebar + chat window + context-intelligence rail
 * (Learning Snapshot, Context Preview, Quick Actions). Fills the viewport below
 * the app navbar; each region handles its own scrolling.
 */
export function AIWorkspace() {
  return <AIMentorWorkspace className="h-[calc(100vh-8rem)] min-h-[34rem]" />;
}
