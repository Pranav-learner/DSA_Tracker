import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Zap, ArrowRight, Award } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { ChallengeProgressBar } from './ChallengeProgressBar';
import { CHALLENGE_TYPE_META, formatTimeRemaining } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import type { Challenge } from '@/types';

interface ChallengeCardProps {
  challenge: Challenge;
  className?: string;
}

/** Where a challenge's advancing activity is performed → its quick-resume link. */
const RESUME_LINK: Record<string, { to: string; label: string }> = {
  'problem-solved': { to: '/problems', label: 'Solve problems' },
  'revision-completed': { to: '/revision', label: 'Start revision' },
  'notebook-created': { to: '/notebook', label: 'Open notebook' },
  'contest-finished': { to: '/contests', label: 'Go to contests' },
  'topic-completed': { to: '/roadmap', label: 'Continue roadmap' },
};

/**
 * ChallengeCard — one challenge with its cadence chip, animated progress bar,
 * reward and time remaining. Completed challenges show a success state; active
 * ones surface a quick-resume link to the relevant workflow.
 */
export function ChallengeCard({ challenge, className }: ChallengeCardProps) {
  const meta = CHALLENGE_TYPE_META[challenge.challengeType];
  const done = challenge.status === 'Completed';
  const resume = RESUME_LINK[challenge.activityType];

  return (
    <CardContainer className={cn('flex flex-col gap-3', done && 'border-success/30 bg-success/[0.04]', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={cn('mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', meta.tint)}>
            {meta.label}
          </span>
          <p className="truncate text-sm font-semibold">{challenge.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{challenge.description}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <Zap className="size-3" /> +{challenge.rewardXP}
        </span>
      </div>

      <ChallengeProgressBar
        value={challenge.currentProgress}
        max={challenge.targetValue}
        showLabel
        fillClassName={done ? 'bg-success' : 'bg-gradient-to-r from-primary/70 to-primary'}
      />

      <div className="flex items-center justify-between text-xs">
        {done ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <CheckCircle2 className="size-3.5" /> Completed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" /> {formatTimeRemaining(challenge.secondsRemaining)}
          </span>
        )}

        {done && challenge.rewardBadge ? (
          <span className="inline-flex items-center gap-1 text-amber-400">
            <Award className="size-3.5" /> Badge
          </span>
        ) : !done && resume ? (
          <Link to={resume.to} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            {resume.label} <ArrowRight className="size-3" />
          </Link>
        ) : null}
      </div>
    </CardContainer>
  );
}
