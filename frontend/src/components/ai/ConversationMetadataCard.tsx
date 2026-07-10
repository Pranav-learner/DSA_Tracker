import { MessageSquare, Coins, Cpu, Layers, Clock } from 'lucide-react';
import { relativeTime, cn } from '@/lib/utils';
import { INTENT_LABEL } from '@/lib/aiCatalog';
import type { Conversation, AiIntent } from '@/types';

/**
 * ConversationMetadataCard — the stored metadata for a conversation: message
 * count, total token usage, last intent, provider/model and recency. Surfaces the
 * telemetry the backend denormalises onto each thread (for the details popover /
 * export dialog header).
 */
export function ConversationMetadataCard({ conversation, className }: { conversation: Conversation; className?: string }) {
  const c = conversation;
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <Item icon={<MessageSquare className="size-3.5" />} label="Messages" value={String(c.messageCount)} />
      <Item icon={<Coins className="size-3.5" />} label="Tokens" value={c.totalTokens.toLocaleString()} />
      <Item
        icon={<Layers className="size-3.5" />}
        label="Last intent"
        value={c.lastIntent ? INTENT_LABEL[c.lastIntent as AiIntent] ?? c.lastIntent : '—'}
      />
      <Item
        icon={<Cpu className="size-3.5" />}
        label="Model"
        value={c.lastModel ? `${c.lastProvider ?? ''} ${c.lastModel}`.trim() : c.lastProvider ?? '—'}
      />
      <Item
        icon={<Clock className="size-3.5" />}
        label="Updated"
        value={relativeTime(c.lastMessageAt ?? c.updatedAt)}
        span
      />
    </div>
  );
}

function Item({
  icon,
  label,
  value,
  span,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-background/40 px-2.5 py-1.5', span && 'col-span-2')}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 truncate text-xs font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}
