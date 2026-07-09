import type { ReactNode } from 'react';
import { CardContainer } from '@/components/common/CardContainer';

interface LessonCardProps {
  title: string;
  icon: ReactNode;
  items: string[];
  emptyText?: string;
}

/** Bullet-list section (e.g. Common Mistakes). Reusable for any string list. */
export function LessonCard({ title, icon, items, emptyText = 'Nothing recorded yet.' }: LessonCardProps) {
  return (
    <CardContainer className="space-y-2">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-muted-foreground">{emptyText}</p>
      )}
    </CardContainer>
  );
}
