import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, RotateCcw, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfidenceSlider } from './ConfidenceSlider';
import { relativeTime, cn } from '@/lib/utils';
import type { NotebookListItem } from '@/types';

/** A notebook entry as a card in the index — opens the workspace. */
export function NotebookCard({ entry, index = 0 }: { entry: NotebookListItem; index?: number }) {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/notebook/${entry.id}`)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      whileHover={{ y: -3 }}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 text-left shadow-card backdrop-blur-sm transition-colors',
        'hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="space-y-1">
        <h3 className="line-clamp-2 font-semibold leading-tight">{entry.title}</h3>
        <p className="text-xs text-muted-foreground">{entry.pattern}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          <BookOpen className="size-3" /> {entry.topicTitle}
        </Badge>
      </div>

      <ConfidenceSlider value={entry.confidence} readOnly />

      <div className="mt-auto flex items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <RotateCcw className="size-3" /> {entry.revisionCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <Network className="size-3" /> {entry.relatedCount}
        </span>
        <span className="ml-auto">Updated {relativeTime(entry.updatedAt)}</span>
      </div>
    </motion.button>
  );
}
