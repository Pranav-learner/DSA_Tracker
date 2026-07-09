import { FileText, ScrollText, Image, Link as LinkIcon, NotebookPen, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { Badge } from '@/components/ui/badge';
import type { LearningResourceDef } from '@/lib/learningResources';

const ICONS: Record<string, LucideIcon> = {
  'concept-notes': FileText,
  'cheat-sheet': ScrollText,
  'visual-explanation': Image,
  'reference-links': LinkIcon,
  'editorial-notes': NotebookPen,
};

/** Placeholder card for a future learning resource (markdown-ready). */
export function LearningResourceCard({ resource }: { resource: LearningResourceDef }) {
  const Ico = ICONS[resource.key] ?? FileText;
  return (
    <CardContainer interactive className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-accent text-primary">
          <Ico className="size-5" />
        </span>
        <Badge variant="outline">
          <Lock className="size-3" /> {resource.availability}
        </Badge>
      </div>
      <div>
        <h3 className="font-medium">{resource.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
      </div>
    </CardContainer>
  );
}
