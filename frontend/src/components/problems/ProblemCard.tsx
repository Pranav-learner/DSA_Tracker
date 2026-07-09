import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star as StarIcon } from 'lucide-react';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { PlatformBadge } from './PlatformBadge';
import { ProblemStatusBadge } from './ProblemStatusBadge';
import { FavoriteButton } from './FavoriteButton';
import { TagChip } from './TagChip';
import { cn } from '@/lib/utils';
import type { ProblemListItem } from '@/types';

interface ProblemCardProps {
  problem: ProblemListItem;
  index?: number;
}

/** Grid card for a problem — the grid-view counterpart of a table row. */
export function ProblemCard({ problem, index = 0 }: ProblemCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/problems/${problem.id}`)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -3 }}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 text-left shadow-card backdrop-blur-sm transition-colors',
        'hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="line-clamp-2 font-semibold leading-tight">{problem.title}</h3>
          {problem.representative && (
            <StarIcon className="mt-0.5 size-3 shrink-0 fill-primary/70 text-primary/70" aria-label="Representative" />
          )}
        </div>
        <FavoriteButton favorite={problem.favorite} className="mt-0.5" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        <PlatformBadge platform={problem.platform} />
      </div>

      <p className="line-clamp-1 text-xs text-muted-foreground">{problem.pattern}</p>

      {problem.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {problem.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-1">
        <ProblemStatusBadge status={problem.status} />
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
          <Clock className="size-3.5" /> {problem.estimatedSolveTime}m
        </span>
      </div>
    </motion.button>
  );
}
