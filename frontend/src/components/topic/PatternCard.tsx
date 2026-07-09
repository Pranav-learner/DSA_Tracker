import { motion } from 'framer-motion';
import { GitBranch, Clock, Eye, Wrench } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { plural } from '@/lib/utils';
import type { Difficulty } from '@/types';

/** Data shape for a Pattern Card — will later come from the Pattern entity. */
export interface PatternCardData {
  name: string;
  coreIdea: string;
  recognitionDifficulty: Difficulty;
  implementationDifficulty: Difficulty;
  relatedTopics: string[];
  estimatedLearningHours: number;
}

/**
 * Reusable Pattern Card. In Sprint 2 it summarises the topic's core pattern;
 * in a later sprint each card links into the Pattern Notebook.
 */
export function PatternCard({ pattern, index = 0 }: { pattern: PatternCardData; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <CardContainer interactive className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-primary">
            <GitBranch className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold leading-tight">{pattern.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pattern.coreIdea}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric icon={<Eye className="size-3.5" />} label="Recognition">
            <DifficultyBadge difficulty={pattern.recognitionDifficulty} />
          </Metric>
          <Metric icon={<Wrench className="size-3.5" />} label="Implementation">
            <DifficultyBadge difficulty={pattern.implementationDifficulty} />
          </Metric>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> {plural(pattern.estimatedLearningHours, 'hour')} to learn
          </span>
          {pattern.relatedTopics.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <GitBranch className="size-3.5" /> {plural(pattern.relatedTopics.length, 'related topic')}
            </span>
          )}
        </div>
      </CardContainer>
    </motion.div>
  );
}

function Metric({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-accent/30 p-2.5">
      <p className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <div>{children}</div>
    </div>
  );
}
