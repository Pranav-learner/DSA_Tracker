import { Clock, Cpu } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';

/** Time + space complexity, shown in mono type. */
export function ComplexityCard({
  timeComplexity,
  spaceComplexity,
}: {
  timeComplexity: string;
  spaceComplexity: string;
}) {
  return (
    <CardContainer className="grid grid-cols-2 gap-4">
      <Item icon={<Clock className="size-4" />} label="Time" value={timeComplexity} />
      <Item icon={<Cpu className="size-4" />} label="Space" value={spaceComplexity} />
    </CardContainer>
  );
}

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label} Complexity</span>
      </div>
      <p className="font-mono text-lg font-semibold">{value || '—'}</p>
    </div>
  );
}
