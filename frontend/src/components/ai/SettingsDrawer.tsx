import { AnimatePresence, motion } from 'framer-motion';
import { X, Cpu } from 'lucide-react';
import { useAISettings, useUpdateAISettings, useAIProviders } from '@/hooks/useAI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSettingsOpen } from '@/store/slices/aiSlice';
import { ProviderSelector } from './ProviderSelector';
import { ModelSelector } from './ModelSelector';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProviderId } from '@/types';

/**
 * SettingsDrawer — a slide-in panel for AI preferences: provider, model,
 * temperature, max tokens and streaming. Changes persist immediately via the
 * settings mutation; the provider list (with health) comes from /providers.
 */
export function SettingsDrawer() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ai.settingsOpen);
  const { data: settings, isLoading } = useAISettings();
  const { data: providersData } = useAIProviders();
  const update = useUpdateAISettings();

  const providers = providersData?.providers ?? [];
  const currentProvider = providers.find((p) => p.id === settings?.preferredProvider);
  const close = () => dispatch(setSettingsOpen(false));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-card shadow-card"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Cpu className="size-4 text-primary" /> AI Settings
              </h2>
              <button type="button" onClick={close} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {isLoading || !settings ? (
                <>
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </>
              ) : (
                <>
                  <Field label="Provider" hint={currentProvider?.health}>
                    <ProviderSelector
                      providers={providers}
                      value={settings.preferredProvider}
                      onChange={(provider: ProviderId) => update.mutate({ preferredProvider: provider })}
                      className="w-full"
                    />
                  </Field>

                  <Field label="Model">
                    <ModelSelector
                      models={currentProvider?.models ?? []}
                      value={settings.preferredModel}
                      onChange={(model) => update.mutate({ preferredModel: model })}
                      className="w-full"
                    />
                  </Field>

                  <Field label={`Temperature — ${settings.temperature.toFixed(1)}`} hint="Lower = focused, higher = creative">
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.1}
                      value={settings.temperature}
                      onChange={(e) => update.mutate({ temperature: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </Field>

                  <Field label="Max tokens" hint="Upper bound on response length">
                    <input
                      type="number"
                      min={64}
                      max={8192}
                      step={64}
                      value={settings.maxTokens}
                      onChange={(e) => update.mutate({ maxTokens: Number(e.target.value) })}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/50"
                    />
                  </Field>

                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">Streaming responses</span>
                    <input
                      type="checkbox"
                      checked={settings.streamingEnabled}
                      onChange={(e) => update.mutate({ streamingEnabled: e.target.checked })}
                      className="size-4 accent-primary"
                    />
                  </label>

                  <p className="rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
                    API keys are stored server-side only and are never exposed to the browser. When a provider has no
                    key configured, the offline mentor is used automatically.
                  </p>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
