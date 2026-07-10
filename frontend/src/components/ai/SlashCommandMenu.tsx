import { useEffect, useMemo, useState } from 'react';
import { Slash, CornerDownLeft } from 'lucide-react';
import { SLASH_COMMANDS, type SlashCommandMeta } from '@/lib/aiCatalog';
import { cn } from '@/lib/utils';

interface SlashCommandMenuProps {
  /** The current input query after the leading slash (e.g. "stu" for "/stu"). */
  query: string;
  onSelect: (command: SlashCommandMeta) => void;
  className?: string;
}

/**
 * SlashCommandMenu — the command palette shown above the input when the message
 * begins with "/". Filters the slash-command catalogue as the learner types and
 * supports arrow-key navigation + Enter to select. Selecting a command inserts it
 * and preselects the matching context profile.
 */
export function SlashCommandMenu({ query, onSelect, className }: SlashCommandMenuProps) {
  const matches = useMemo(() => {
    const q = query.toLowerCase();
    return SLASH_COMMANDS.filter((c) => c.command.startsWith(q) || c.label.toLowerCase().includes(q));
  }, [query]);

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [query]);

  // Keyboard navigation is handled by the parent input (it forwards key events);
  // we expose the handler via a data attribute contract instead. To keep this
  // component self-contained, we listen on the document while mounted.
  useEffect(() => {
    if (!matches.length) return;
    const onKey = (e: KeyboardEvent) => {
      // Handled in the capture phase and stopped so the input's Enter-to-send /
      // caret navigation doesn't also fire while the palette is open.
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => (i + 1) % matches.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => (i - 1 + matches.length) % matches.length);
      } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        onSelect(matches[index]);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [matches, index, onSelect]);

  if (!matches.length) return null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-glow',
        className,
      )}
      role="listbox"
      aria-label="Slash commands"
    >
      <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Slash className="size-3" /> Commands
      </div>
      <ul className="max-h-64 overflow-y-auto p-1">
        {matches.map((c, i) => (
          <li key={c.command}>
            <button
              type="button"
              onMouseEnter={() => setIndex(i)}
              onClick={() => onSelect(c)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                i === index ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60',
              )}
              role="option"
              aria-selected={i === index}
            >
              <span className="font-mono text-xs text-primary">/{c.command}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{c.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{c.description}</span>
              </span>
              {i === index && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
