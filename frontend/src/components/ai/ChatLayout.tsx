import { ConversationSidebar } from './ConversationSidebar';
import { ChatWindow } from './ChatWindow';
import { SettingsDrawer } from './SettingsDrawer';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

/**
 * ChatLayout — the AI Workspace shell: a collapsible conversation sidebar, the
 * chat window, and the settings drawer overlay. Fills the available height and
 * owns no data itself — each region self-fetches.
 */
export function ChatLayout({ className }: { className?: string }) {
  const sidebarOpen = useAppSelector((s) => s.ai.sidebarOpen);

  return (
    <div className={cn('flex overflow-hidden rounded-xl border border-border bg-card/40', className)}>
      {/* Sidebar — collapsible; hidden on mobile unless toggled open. */}
      <div className={cn('w-64 shrink-0 transition-all duration-200', sidebarOpen ? 'block' : 'hidden', 'lg:block')}>
        <ConversationSidebar className="h-full" />
      </div>

      <div className="min-w-0 flex-1">
        <ChatWindow />
      </div>

      <SettingsDrawer />
    </div>
  );
}
