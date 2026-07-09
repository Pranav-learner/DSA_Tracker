import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Target, Layers, Flag } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { CardContainer } from '@/components/common/CardContainer';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { CompletionBadge } from '@/components/learning/CompletionBadge';
import { PATTERN_LADDER } from '@/lib/patternLadder';
import { STAGE_LABELS } from '@/lib/mastery';
import type { LadderStage, TopicDetail, TopicProgressStatus } from '@/types';

interface TopicHeaderProps {
  topic: TopicDetail;
  /** Sprint 3 live progress — when present, shows real status & current stage. */
  status?: TopicProgressStatus;
  currentStage?: LadderStage;
}

/** The workspace hero: identity, phase, difficulty, estimates and status. */
export function TopicHeader({ topic, status, currentStage }: TopicHeaderProps) {
  const stageLabel = currentStage ? STAGE_LABELS[currentStage] : PATTERN_LADDER[0].title;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <CardContainer className="relative overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: topic.phase.color }}
        />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border"
              style={{ backgroundColor: `${topic.phase.color}1a`, color: topic.phase.color }}
            >
              <Icon name={topic.phase.icon} className="size-7" />
            </div>
            <div>
              <Link
                to={`/roadmap/${topic.phaseId}`}
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                Phase {topic.phase.order} · {topic.phase.title}
              </Link>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">{topic.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{topic.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <DifficultyBadge difficulty={topic.difficulty} />
                {status ? (
                  <CompletionBadge status={status} />
                ) : (
                  <StatusBadge isUnlocked={topic.isUnlocked} isCompleted={topic.isCompleted} />
                )}
                <Badge variant="outline">
                  <Flag className="size-3" /> Stage: {stageLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Estimate strip */}
          <div className="grid grid-cols-3 gap-3 lg:w-auto lg:min-w-[280px]">
            <HeaderStat icon={<Clock className="size-4" />} label="Hours" value={topic.estimatedHours} />
            <HeaderStat
              icon={<Target className="size-4" />}
              label="Problems"
              value={topic.estimatedProblems}
            />
            <HeaderStat
              icon={<Layers className="size-4" />}
              label="Stages"
              value={PATTERN_LADDER.length}
            />
          </div>
        </div>
      </CardContainer>
    </motion.div>
  );
}

function HeaderStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-accent/40 p-3 text-center">
      <div className="mx-auto mb-1 flex size-7 items-center justify-center rounded-md bg-background text-primary">
        {icon}
      </div>
      <p className="text-lg font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
