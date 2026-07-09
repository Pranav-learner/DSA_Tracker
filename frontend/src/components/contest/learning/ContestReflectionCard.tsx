import { CardContainer } from '@/components/common/CardContainer';
import { Button } from '@/components/ui/button';
import { Pencil, ClipboardList } from 'lucide-react';
import { StrengthCard } from './StrengthCard';
import { WeaknessCard } from './WeaknessCard';
import { cn } from '@/lib/utils';
import type { ContestPostmortem } from '@/types';

function Block({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-foreground">{text}</p>
    </div>
  );
}

/** The read view of a contest reflection / postmortem (markdown as pre-wrap). */
export function ContestReflectionCard({ postmortem, onEdit, className }: { postmortem: ContestPostmortem; onEdit?: () => void; className?: string }) {
  return (
    <CardContainer className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><ClipboardList className="size-4 text-primary" /> Contest Reflection</h3>
        {onEdit && <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="size-4" /> Edit</Button>}
      </div>

      {postmortem.overallPerformance && <p className="text-sm font-medium">{postmortem.overallPerformance}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Block label="What went well" text={postmortem.whatWentWell} />
        <Block label="What went wrong" text={postmortem.whatWentWrong} />
        <Block label="Biggest mistake" text={postmortem.biggestMistake} />
        <Block label="Biggest learning" text={postmortem.biggestLearning} />
        <Block label="Next focus" text={postmortem.nextFocus} />
        <Block label="Time management" text={postmortem.timeManagementNotes} />
      </div>

      {(postmortem.strengths.length > 0 || postmortem.weaknesses.length > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {postmortem.strengths.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Strengths</p>
              {postmortem.strengths.map((s, i) => <StrengthCard key={i} text={s} />)}
            </div>
          )}
          {postmortem.weaknesses.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Weaknesses</p>
              {postmortem.weaknesses.map((w, i) => <WeaknessCard key={i} text={w} />)}
            </div>
          )}
        </div>
      )}
    </CardContainer>
  );
}
