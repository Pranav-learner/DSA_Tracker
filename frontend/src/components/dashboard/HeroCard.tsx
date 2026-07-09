import { motion } from 'framer-motion';
import { Play, Flag, Layers, RefreshCw, Brain } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { MasteryRing } from '@/components/learning/MasteryRing';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/Icon';
import { QuickActionButton } from './QuickActionButton';
import { STAGE_LABELS } from '@/lib/mastery';
import { plural } from '@/lib/utils';
import type { LadderStage, PhaseRef, TopicSummary } from '@/types';

interface HeroCardProps {
  greeting: string;
  phase: PhaseRef | null;
  topic: TopicSummary | null;
  stage: LadderStage | null;
  overallMastery: number;
  completionPercent: number;
  topicsRemaining: number;
  continueTo: string;
  continueLabel: string;
  /** Overall retention (Sprint 4) — shown beside overall mastery. */
  overallRetention?: number;
  /** Optional secondary action, e.g. Start Revision. */
  secondaryTo?: string;
  secondaryLabel?: string;
}

/**
 * The dashboard's focal point — an at-a-glance "where am I + what's next" hero.
 * Greeting, current phase/topic/stage, overall mastery ring and the primary
 * Continue action, all in one premium gradient surface.
 */
export function HeroCard({
  greeting,
  phase,
  topic,
  stage,
  overallMastery,
  completionPercent,
  topicsRemaining,
  continueTo,
  continueLabel,
  overallRetention,
  secondaryTo,
  secondaryLabel,
}: HeroCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <CardContainer className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.12] via-card/60 to-card/60 p-6 sm:p-7">
        {/* Ambient glow accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {greeting}
            </p>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {topic ? 'Currently studying' : 'Your next step'}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {topic?.title ?? 'Start your roadmap'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {phase && (
                <Badge variant="outline">
                  <Icon name={phase.icon} className="size-3" /> Phase {phase.order} · {phase.title}
                </Badge>
              )}
              {stage && (
                <Badge variant="primary">
                  <Flag className="size-3" /> {STAGE_LABELS[stage]}
                </Badge>
              )}
              {topic && <DifficultyBadge difficulty={topic.difficulty} />}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <QuickActionButton to={continueTo} label={continueLabel} icon={<Play className="size-4" />} />
              {secondaryTo && secondaryLabel && (
                <QuickActionButton
                  to={secondaryTo}
                  label={secondaryLabel}
                  icon={<RefreshCw className="size-4" />}
                  variant="secondary"
                />
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers className="size-3.5" /> {plural(topicsRemaining, 'topic')} remaining
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-row items-center gap-4 sm:flex-col sm:gap-2">
            <MasteryRing value={overallMastery} size={120} strokeWidth={9} label="Overall" />
            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground sm:text-center">
              <span>
                <span className="font-semibold tabular-nums text-foreground">{completionPercent}%</span> complete
              </span>
              {overallRetention !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Brain className="size-3" />
                  <span className="font-semibold tabular-nums text-foreground">{overallRetention}%</span> retention
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContainer>
    </motion.div>
  );
}
