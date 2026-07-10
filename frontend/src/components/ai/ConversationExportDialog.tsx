import { useState } from 'react';
import { FileText, FileJson, Download, Loader2, Check } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { useExportConversation } from '@/hooks/useAI';
import { ConversationMetadataCard } from './ConversationMetadataCard';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationExportDialogProps {
  conversation: Conversation | null;
  open: boolean;
  onClose: () => void;
}

type Format = 'markdown' | 'json';

/**
 * ConversationExportDialog — export a conversation as Markdown or JSON. The
 * backend returns a size-limited payload (role/content/timestamps only — never the
 * internal context snapshot); this dialog turns it into a browser download.
 */
export function ConversationExportDialog({ conversation, open, onClose }: ConversationExportDialogProps) {
  const [format, setFormat] = useState<Format>('markdown');
  const [done, setDone] = useState(false);
  const exporter = useExportConversation();

  const handleExport = async () => {
    if (!conversation) return;
    setDone(false);
    const result = await exporter.mutateAsync({ id: conversation.id, format });
    // Trigger a client-side download from the returned payload.
    const blob = new Blob([result.content], { type: result.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export conversation"
      description={conversation ? conversation.title : undefined}
    >
      <div className="space-y-4">
        {conversation && <ConversationMetadataCard conversation={conversation} />}

        <div className="grid grid-cols-2 gap-2">
          <FormatCard
            active={format === 'markdown'}
            onClick={() => setFormat('markdown')}
            icon={<FileText className="size-4" />}
            title="Markdown"
            detail="Readable .md file"
          />
          <FormatCard
            active={format === 'json'}
            onClick={() => setFormat('json')}
            icon={<FileJson className="size-4" />}
            title="JSON"
            detail="Structured .json data"
          />
        </div>

        <p className="rounded-lg border border-border bg-background/60 p-2.5 text-[11px] text-muted-foreground">
          Exports include only your messages and the mentor's replies with timestamps. Internal context and system
          prompts are never exported.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleExport} disabled={!conversation || exporter.isPending}>
            {exporter.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : done ? (
              <Check className="size-4" />
            ) : (
              <Download className="size-4" />
            )}
            {done ? 'Downloaded' : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FormatCard({
  active,
  onClick,
  icon,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
        active ? 'border-primary/50 bg-primary/[0.06]' : 'border-border hover:border-primary/30',
      )}
    >
      <span className={cn('flex size-8 items-center justify-center rounded-lg', active ? 'bg-primary/15 text-primary' : 'bg-accent text-muted-foreground')}>
        {icon}
      </span>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-[11px] text-muted-foreground">{detail}</span>
    </button>
  );
}
