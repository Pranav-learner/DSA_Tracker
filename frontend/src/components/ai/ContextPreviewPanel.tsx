import { Eye, Lock, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSection } from '@/store/slices/aiSlice';
import { useContextPreview } from '@/hooks/useAI';
import { CardContainer } from '@/components/common/CardContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { INTENT_LABEL } from '@/lib/aiCatalog';
import { cn } from '@/lib/utils';

/**
 * ContextPreviewPanel — the transparency + control surface for Context
 * Intelligence. It shows exactly which context sections will be sent to the LLM
 * for the current intent/profiles, with a token estimate, and lets the learner
 * toggle optional sections off before sending (the core learner profile is
 * locked). Toggles feed `excludedSections` in Redux, which the chat turn honours.
 */
export function ContextPreviewPanel({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const activeCommand = useAppSelector((s) => s.ai.activeCommand);
  const previewIntent = useAppSelector((s) => s.ai.previewIntent);
  const excluded = useAppSelector((s) => s.ai.excludedSections);

  const params = {
    intent: previewIntent,
    profiles: activeCommand?.profiles,
    exclude: excluded,
  };
  const { data: preview, isLoading, isError, refetch } = useContextPreview(params);

  return (
    <CardContainer className={cn('space-y-3', className)}>
      <header className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Eye className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Context Preview</h3>
          <p className="text-[11px] text-muted-foreground">{INTENT_LABEL[previewIntent]} · what the mentor sees</p>
        </div>
        {preview && (
          <span
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums',
              preview.overBudget ? 'bg-warning/15 text-warning' : 'bg-accent text-muted-foreground',
            )}
            title="Estimated context tokens"
          >
            ~{preview.includedTokens} tok
          </span>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <button
          type="button"
          onClick={() => refetch()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-4 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" /> Couldn't load context — retry
        </button>
      ) : (
        <ul className="space-y-1.5">
          {preview?.sections.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                disabled={!s.optional}
                onClick={() => s.optional && dispatch(toggleSection(s.key))}
                className={cn(
                  'group flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors',
                  s.included ? 'border-primary/25 bg-primary/[0.05]' : 'border-border bg-background/40 opacity-70',
                  s.optional ? 'cursor-pointer hover:border-primary/40' : 'cursor-default',
                )}
                aria-pressed={s.included}
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                    s.included ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                  )}
                >
                  {s.included && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium">{s.title}</span>
                    {!s.optional && <Lock className="size-2.5 shrink-0 text-muted-foreground" />}
                    <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground">~{s.tokenEstimate}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{s.preview || 'No data yet'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview?.overBudget && (
        <p className="flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/[0.06] p-2 text-[11px] text-warning">
          <AlertTriangle className="size-3.5 shrink-0" /> Context is large — toggle sections off to keep the mentor focused.
        </p>
      )}
    </CardContainer>
  );
}
