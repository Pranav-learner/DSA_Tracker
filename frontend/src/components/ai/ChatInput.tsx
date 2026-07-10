import { useRef, useEffect, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ChatInput — an auto-growing textarea with Enter-to-send (Shift+Enter for a
 * newline) and a send button. Purely controlled; the parent owns the value and
 * decides when sending is allowed (e.g. blocked while streaming).
 */
export function ChatInput({ value, onChange, onSend, disabled, placeholder }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow up to a max height.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border bg-card/60 p-2 focus-within:border-primary/40">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={placeholder ?? 'Ask your mentor anything…'}
        className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all active:scale-95',
          'disabled:cursor-not-allowed disabled:opacity-40',
        )}
        aria-label="Send message"
      >
        <SendHorizontal className="size-4" />
      </button>
    </div>
  );
}
