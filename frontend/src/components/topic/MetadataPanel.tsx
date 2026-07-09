import { Link } from 'react-router-dom';
import { Gauge, Clock, Target, ListChecks, GitBranch, ArrowRight, Milestone } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TopicDetail, TopicRelations, TopicSummary } from '@/types';

interface MetadataPanelProps {
  topic: TopicDetail;
  relations?: TopicRelations;
  relationsLoading?: boolean;
}

/** At-a-glance metadata + topic relations sidebar. */
export function MetadataPanel({ topic, relations, relationsLoading }: MetadataPanelProps) {
  return (
    <CardContainer className="space-y-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Topic Metadata
      </h3>

      <dl className="space-y-3">
        <Row icon={<Gauge className="size-4" />} label="Difficulty">
          <DifficultyBadge difficulty={topic.difficulty} />
        </Row>
        <Row icon={<Clock className="size-4" />} label="Estimated Hours">
          <span className="font-medium tabular-nums">{topic.estimatedHours}</span>
        </Row>
        <Row icon={<Target className="size-4" />} label="Estimated Problems">
          <span className="font-medium tabular-nums">{topic.estimatedProblems}</span>
        </Row>
        <Row icon={<ListChecks className="size-4" />} label="Representative">
          <span className="font-medium tabular-nums">{topic.representativeProblemCount}</span>
        </Row>
      </dl>

      <Divider />

      <RelationGroup
        icon={<Milestone className="size-4" />}
        label="Prerequisites"
        loading={relationsLoading}
        topics={relations?.prerequisites}
        emptyText="No prerequisites"
      />

      <RelationGroup
        icon={<GitBranch className="size-4" />}
        label="Related Topics"
        loading={relationsLoading}
        topics={relations?.related}
        emptyText="No related topics"
      />

      <Divider />

      {/* Next topic (from navigation) */}
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <ArrowRight className="size-4" /> Next Topic
        </p>
        {topic.navigation.next ? (
          <Link
            to={`/topic/${topic.navigation.next.id}`}
            className="group flex items-center justify-between rounded-md border border-border bg-accent/40 px-3 py-2 text-sm transition-colors hover:border-primary/40"
          >
            <span className="font-medium">{topic.navigation.next.title}</span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">End of phase</p>
        )}
      </div>
    </CardContainer>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function RelationGroup({
  icon,
  label,
  loading,
  topics,
  emptyText,
}: {
  icon: React.ReactNode;
  label: string;
  loading?: boolean;
  topics?: TopicSummary[];
  emptyText: string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      {loading ? (
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ) : topics && topics.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <Link
              key={t.id}
              to={`/topic/${t.id}`}
              className={cn(
                'rounded-full border border-border bg-accent/40 px-2.5 py-1 text-xs font-medium transition-colors',
                'hover:border-primary/40 hover:text-foreground',
              )}
            >
              {t.title}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}
