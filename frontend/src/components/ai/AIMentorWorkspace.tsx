import { Sparkles, Zap } from 'lucide-react';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatWindow } from './ChatWindow';
import { SettingsDrawer } from './SettingsDrawer';
import { LearningSnapshotCard } from './LearningSnapshotCard';
import { ContextProfileSelector } from './ContextProfileSelector';
import { ContextPreviewPanel } from './ContextPreviewPanel';
import { QuickActionPanel } from './QuickActionPanel';
import { useAIWorkspace, useChatStream } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveCommand } from '@/store/slices/aiSlice';
import { findSlashCommand } from '@/lib/aiCatalog';
import { cn } from '@/lib/utils';

/**
 * AIMentorWorkspace — the premium AI Mentor shell (Module 7 · Sprint 2). Three
 * regions: a collapsible conversation sidebar, the chat window, and a context
 * intelligence rail (auto-updating Learning Snapshot, context-profile selector,
 * live Context Preview and Learning Quick Actions). Each region self-fetches; the
 * rail's quick actions and the chat share the same Redux-backed streaming state,
 * so an action started in the rail streams into the chat window.
 */
export function AIMentorWorkspace({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ai.sidebarOpen);
  const rightRailOpen = useAppSelector((s) => s.ai.rightRailOpen);
  const { data: workspace, isLoading } = useAIWorkspace();
  const { send } = useChatStream();

  /** One-tap quick action: preselect the command's context, then send its starter. */
  const runCommand = (command: string) => {
    const meta = findSlashCommand(command);
    if (!meta) return;
    dispatch(setActiveCommand(meta));
    send(meta.starter, { intent: meta.intent, profiles: meta.profiles });
  };

  return (
    <div className={cn('flex overflow-hidden rounded-xl border border-border bg-card/40', className)}>
      {/* Conversation sidebar — collapsible; hidden on mobile unless toggled open. */}
      <div className={cn('w-64 shrink-0 transition-all duration-200', sidebarOpen ? 'block' : 'hidden', 'lg:block')}>
        <ConversationSidebar className="h-full" />
      </div>

      {/* Chat window */}
      <div className="min-w-0 flex-1">
        <ChatWindow />
      </div>

      {/* Context intelligence rail */}
      {rightRailOpen && (
        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface/40 p-3 xl:flex">
          <div className="space-y-4">
            <LearningSnapshotCard snapshot={workspace?.snapshot} isLoading={isLoading} />

            <div className="space-y-2">
              <p className="flex items-center gap-1.5 px-1 text-xs font-semibold text-foreground">
                <Sparkles className="size-3.5 text-primary" /> Context mode
              </p>
              <ContextProfileSelector className="px-1" />
            </div>

            <ContextPreviewPanel />

            {workspace && workspace.quickActions.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 px-1 text-xs font-semibold text-foreground">
                  <Zap className="size-3.5 text-primary" /> Quick actions
                </p>
                <QuickActionPanel actions={workspace.quickActions} onAction={runCommand} />
              </div>
            )}
          </div>
        </aside>
      )}

      <SettingsDrawer />
    </div>
  );
}
