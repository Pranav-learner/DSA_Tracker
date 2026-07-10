import { ChatLayout } from '@/components/ai';

/**
 * AIWorkspace — the AI Mentor page (Module 7 · Sprint 1). A full-height chat
 * workspace (sidebar + chat + settings). Fills the viewport below the app navbar;
 * the chat regions handle their own scrolling.
 */
export function AIWorkspace() {
  return <ChatLayout className="h-[calc(100vh-8rem)] min-h-[32rem]" />;
}
