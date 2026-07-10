import { Wand2, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveCommand } from '@/store/slices/aiSlice';
import { SLASH_COMMANDS } from '@/lib/aiCatalog';
import { cn } from '@/lib/utils';

/**
 * ContextProfileSelector — lets the learner preselect the context mode (a slash
 * command → intent + context profiles) before sending, or leave it on "Auto" so
 * the backend IntentRouter classifies the message. The selection drives both the
 * Context Preview and the next chat turn.
 */
export function ContextProfileSelector({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.ai.activeCommand);

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      <Chip active={!active} onClick={() => dispatch(setActiveCommand(null))} icon={<Wand2 className="size-3" />}>
        Auto
      </Chip>
      {SLASH_COMMANDS.filter((c) => c.command !== 'help').map((c) => {
        const isActive = active?.command === c.command;
        return (
          <Chip
            key={c.command}
            active={isActive}
            title={c.description}
            onClick={() => dispatch(setActiveCommand(isActive ? null : c))}
          >
            {isActive && <Check className="size-3" />}
            {c.label}
          </Chip>
        );
      })}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        active
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
