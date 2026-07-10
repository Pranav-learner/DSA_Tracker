import { RefreshCw, ArrowDownToLine } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { cn } from '@/lib/utils';

interface MessageToolbarProps {
  content: string;
  /** Re-run the last user turn (assistant messages only). */
  onRegenerate?: () => void;
  /** Ask the mentor to continue the response (assistant messages only). */
  onContinue?: () => void;
  className?: string;
}

/**
 * MessageToolbar — the per-message action row for an assistant turn: copy,
 * regenerate and continue. Kept as a small reusable unit so the same actions can
 * appear inline in the bubble and in a hover menu.
 */
export function MessageToolbar({ content, onRegenerate, onContinue, className }: MessageToolbarProps) {
  return (
    <span className={cn('flex items-center', className)}>
      <CopyButton text={content} />
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Continue response"
          title="Continue response"
        >
          <ArrowDownToLine className="size-3.5" />
        </button>
      )}
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Regenerate response"
          title="Regenerate response"
        >
          <RefreshCw className="size-3.5" />
        </button>
      )}
    </span>
  );
}
